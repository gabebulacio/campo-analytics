"""Semantic-layer linter (runs in CI): undefined references, missing descriptions,
missing synonyms, orphan dimensions, undeclared joins, golden/few-shot disjointness."""

from pathlib import Path

import yaml
from app.compiler import reachable
from app.plan import plan_from_yaml
from app.semantic import refs
from app.validator import validate

ROOT = Path(__file__).resolve().parents[3]


def test_loads_without_errors(sl):
    assert sl.errors == []
    assert len(sl.metrics) >= 30


def test_relationships_reference_real_columns(sl):
    for r in sl.relationships:
        assert r.from_entity in sl.entities and r.to_entity in sl.entities
        assert r.from_col in sl.entities[r.from_entity].columns, r
        assert r.to_col in sl.entities[r.to_entity].columns, r


def test_dimension_exprs_reference_declared_columns(sl):
    for d in sl.dimensions.values():
        assert d.entities, f"dimension {d.name} references no entity"
        for ent in d.entities:
            for m in __import__("re").finditer(rf"\b{ent}\.([a-z_0-9]+)", d.expr):
                assert m.group(1) in sl.entities[ent].columns, f"{d.name}: {ent}.{m.group(1)} undeclared"


def test_every_metric_has_description_label_workspace(sl):
    for m in sl.metrics.values():
        assert m.workspace in sl.workspaces, m.name
        assert m.label.get("en") and m.label.get("he"), m.name
        assert m.unit, m.name


def test_metric_exprs_reference_declared_entities(sl):
    names = set(sl.entities)
    for m in sl.metrics.values():
        for c in m.components:
            assert c.entity in names, (m.name, c.entity)
            for e in [c.expr, *c.filters]:
                for ent in refs(e, names):
                    assert ent in reachable(sl, c.entity, c.joins_via), f"{m.name}: {ent} not joinable from {c.entity}"


def test_allowed_dimensions_exist_and_are_reachable(sl):
    """No undeclared joins: every allowed dimension is reachable from the metric's primary component."""
    for m in sl.metrics.values():
        primary = m.numerator or m.component
        reach = reachable(sl, primary.entity, primary.joins_via)
        for d in m.allowed_dimensions:
            assert d in sl.dimensions, f"{m.name}: unknown dimension {d}"
            assert sl.dimensions[d].entities <= reach, f"{m.name}: dimension {d} has no declared join path"


def test_no_orphan_dimensions(sl):
    used = {d for m in sl.metrics.values() for d in m.allowed_dimensions}
    orphans = set(sl.dimensions) - used
    assert not orphans, f"dimensions not allowed for any metric: {orphans}"


def test_verified_queries_are_valid(sl):
    ids = set()
    for vq in sl.verified_queries:
        assert vq["id"] not in ids
        ids.add(vq["id"])
        assert vq.get("owner") and vq.get("verified_at")
        spec = dict(vq["plan"])
        spec["filters"] = {k: ("EUDR" if k == "standard" else "2024/25") if str(v).startswith("{") else v for k, v in (spec.get("filters") or {}).items()}
        v = validate(sl, plan_from_yaml(spec))
        assert v.ok, (vq["id"], [e.message for e in v.errors], v.clarification)


def test_examples_are_valid(sl):
    for ex in sl.examples:
        v = validate(sl, plan_from_yaml(ex["plan"]))
        assert not v.errors, (ex["question"], [e.message for e in v.errors])


def test_golden_set_disjoint_from_few_shot(sl):
    """Benchmarks evaluate but never feed the context (Databricks Genie pattern)."""
    examples = {" ".join(e["question"].lower().split()) for e in sl.examples}
    golden = set()
    for f in (ROOT / "evals" / "golden").glob("*.yaml"):
        for case in yaml.safe_load(f.read_text(encoding="utf-8")) or []:
            golden.add(" ".join(case["question"].lower().split()))
    assert golden, "golden set is empty"
    assert not (examples & golden), f"few-shot examples leak into golden set: {examples & golden}"
