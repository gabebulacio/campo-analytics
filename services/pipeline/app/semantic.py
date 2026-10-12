"""Semantic layer loader.

Parses docs/semantic-layer/agri_traceability.yaml into typed objects. Nothing
here knows about specific metrics: adding a metric in YAML needs no code.
"""

from __future__ import annotations

import hashlib
import re
import subprocess
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from .config import settings

REF_RE = re.compile(r"\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\b")
STRING_RE = re.compile(r"'(?:[^']|'')*'")


@dataclass(frozen=True)
class Entity:
    name: str
    table: str
    grain: str
    primary_key: tuple[str, ...]
    source: str
    columns: dict[str, dict]


@dataclass(frozen=True)
class Relationship:
    from_entity: str
    from_col: str
    to_entity: str
    to_col: str


@dataclass(frozen=True)
class Dimension:
    name: str
    expr: str
    label: dict[str, str]
    synonyms: tuple[str, ...]
    type: str  # categorical | time
    entities: frozenset[str]

    @property
    def is_timestamp(self) -> bool:
        return "date_trunc" in self.expr


@dataclass(frozen=True)
class Component:
    """One aggregate over one entity (a simple metric or one side of a ratio)."""

    type: str  # sum | count | count_distinct | sum_distinct | median
    entity: str
    expr: str
    filters: tuple[str, ...] = ()
    distinct_on: str | None = None
    joins_via: tuple[str, ...] = ()

    def key(self) -> str:
        raw = "|".join([self.type, self.entity, self.expr, ";".join(self.filters), self.distinct_on or "", ",".join(self.joins_via)])
        return hashlib.sha1(raw.encode()).hexdigest()[:10]


@dataclass
class Metric:
    name: str
    workspace: str
    also_in: list[str]
    label: dict[str, str]
    description: str
    synonyms: list[str]
    type: str
    unit: str
    allowed_dimensions: list[str]
    requires_filter_or_group: list[str]
    checks: dict[str, Any]
    component: Component | None = None
    numerator: Component | None = None
    denominator: Component | None = None
    numerator_ref: str | None = None
    denominator_ref: str | None = None

    @property
    def workspaces(self) -> list[str]:
        return [self.workspace, *self.also_in]

    @property
    def components(self) -> list[Component]:
        return [c for c in (self.component, self.numerator, self.denominator) if c]

    @property
    def additive(self) -> bool:
        return self.type in ("sum", "count")


@dataclass
class SemanticLayer:
    name: str
    version: str
    path: Path
    raw: dict
    workspaces: dict[str, dict]
    entities: dict[str, Entity]
    relationships: list[Relationship]
    dimensions: dict[str, Dimension]
    metrics: dict[str, Metric]
    verified_queries: list[dict]
    examples: list[dict]
    known_gaps: list[dict]
    value_dictionaries: dict
    result_checks: dict
    errors: list[str] = field(default_factory=list)

    def metrics_in(self, workspace: str) -> list[Metric]:
        return [m for m in self.metrics.values() if workspace in m.workspaces]

    def entity_of_table(self, table: str) -> Entity | None:
        return next((e for e in self.entities.values() if e.table == table), None)


def refs(expr: str, entities: set[str]) -> set[str]:
    """Entities referenced in a SQL expression (string literals ignored)."""
    clean = STRING_RE.sub("''", expr)
    return {m.group(1) for m in REF_RE.finditer(clean) if m.group(1) in entities}


def _version(path: Path, text: str) -> str:
    digest = hashlib.sha256(text.encode()).hexdigest()[:10]
    try:
        sha = subprocess.run(["git", "log", "-1", "--format=%h", "--", str(path)], capture_output=True, text=True, cwd=path.parent, timeout=3).stdout.strip()
    except Exception:  # git missing or not a repo
        sha = ""
    return f"{sha}+{digest}" if sha else digest


def _component(spec: dict, default_entity: str | None = None) -> Component:
    return Component(
        type=spec["type"],
        entity=spec.get("entity", default_entity),
        expr=str(spec["expr"]),
        filters=tuple(spec.get("filters", [])),
        distinct_on=spec.get("distinct_on"),
        joins_via=tuple(spec.get("joins_via", [])),
    )


def load(path: Path | None = None) -> SemanticLayer:
    path = path or settings.semantic_path
    text = path.read_text(encoding="utf-8")
    doc = yaml.safe_load(text)
    errors: list[str] = []

    entities = {
        name: Entity(
            name=name,
            table=e["table"],
            grain=e.get("grain", ""),
            primary_key=tuple(e["primary_key"]) if isinstance(e["primary_key"], list) else (e["primary_key"],),
            source=e.get("source", ""),
            columns=e.get("columns", {}),
        )
        for name, e in doc["entities"].items()
    }
    names = set(entities)

    rels = []
    for r in doc["relationships"]:
        fe, fc = r["from"].split(".")
        te, tc = r["to"].split(".")
        rels.append(Relationship(fe, fc, te, tc))

    dims = {}
    for name, dd in doc["dimensions"].items():
        dims[name] = Dimension(
            name=name,
            expr=str(dd["expr"]),
            label=dd.get("label", {"es": name, "en": name}),
            synonyms=tuple(dd.get("synonyms", [])),
            type=dd.get("type", "categorical"),
            entities=frozenset(refs(str(dd["expr"]), names)),
        )

    sets = doc.get("dimension_sets", {})

    def expand(items: list[str]) -> list[str]:
        out: list[str] = []
        for it in items:
            for d in sets.get(it, [it]):
                if d not in out:
                    out.append(d)
        return out

    raw_metrics = doc["metrics"]
    metrics: dict[str, Metric] = {}

    def side(spec, mname: str) -> tuple[Component, str | None]:
        if isinstance(spec, str):  # reference to another simple metric
            ref = raw_metrics[spec]
            return _component(ref), spec
        return _component(spec), None

    for name, m in raw_metrics.items():
        try:
            metric = Metric(
                name=name,
                workspace=m["workspace"],
                also_in=m.get("also_in", []),
                label=m.get("label", {"es": name, "en": name}),
                description=" ".join(str(m.get("description", "")).split()),
                synonyms=[str(s) for s in m.get("synonyms", [])],
                type=m["type"],
                unit=m.get("unit", ""),
                allowed_dimensions=expand(m.get("allowed_dimensions", [])),
                requires_filter_or_group=m.get("requires_filter_or_group", []),
                checks=m.get("checks", {}) or {},
            )
            if metric.type == "ratio":
                metric.numerator, metric.numerator_ref = side(m["numerator"], name)
                metric.denominator, metric.denominator_ref = side(m["denominator"], name)
            else:
                metric.component = _component(m)
            metrics[name] = metric
        except KeyError as e:
            errors.append(f"metric {name}: missing key {e}")

    return SemanticLayer(
        name=doc["name"],
        version=_version(path, text),
        path=path,
        raw=doc,
        workspaces=doc["workspaces"],
        entities=entities,
        relationships=rels,
        dimensions=dims,
        metrics=metrics,
        verified_queries=doc.get("verified_queries", []),
        examples=doc.get("examples", []),
        known_gaps=doc.get("known_gaps", []),
        value_dictionaries=doc.get("value_dictionaries", {}),
        result_checks=doc.get("result_checks", {}),
        errors=errors,
    )


@lru_cache(maxsize=1)
def get() -> SemanticLayer:
    return load()


def reload() -> SemanticLayer:
    get.cache_clear()
    return get()
