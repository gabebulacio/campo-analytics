"""QueryPlan validation against the semantic layer.

Errors are fed back to the planner once (repair loop). A missing required
filter (e.g. `standard`) is not an error: it becomes a clarification.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from rapidfuzz import fuzz, process

from .compiler import reachable
from .config import settings
from .plan import Filter, QueryPlan
from .semantic import SemanticLayer
from .values import get_values, norm, resolve

ISO_DATE = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")
CAMPAIGN = re.compile(r"^(20\d{2})\s*[/-]\s*(\d{2}|20\d{2})$")


@dataclass
class Issue:
    code: str
    message: str
    suggestions: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {"code": self.code, "message": self.message, "suggestions": self.suggestions}


@dataclass
class Clarification:
    dimension: str
    question: dict[str, str]
    options: list[str]


@dataclass
class Validation:
    plan: QueryPlan
    errors: list[Issue] = field(default_factory=list)
    notes: list[Issue] = field(default_factory=list)
    clarification: Clarification | None = None

    @property
    def ok(self) -> bool:
        return not self.errors and self.clarification is None


def latest_closed_campaign() -> str:
    camps = sorted(get_values().get("campaign", []))
    closed = [c for c in camps if int(c[:4]) + 1 <= settings.as_of.year and (int(c[:4]) + 1 < settings.as_of.year or settings.as_of.month > 6)]
    return closed[-1] if closed else (camps[-1] if camps else "")


def _suggest(name: str, choices: dict[str, str]) -> list[str]:
    hits = process.extract(norm(name), list(choices), scorer=fuzz.WRatio, limit=3)
    return list(dict.fromkeys(choices[h[0]] for h in hits if h[1] >= 55))


def _metric_choices(sl: SemanticLayer) -> dict[str, str]:
    out = {}
    for m in sl.metrics.values():
        out[norm(m.name)] = m.name
        for s in [m.label.get("he", ""), m.label.get("en", ""), *m.synonyms]:
            if s:
                out[norm(s)] = m.name
    return out


def validate(sl: SemanticLayer, plan: QueryPlan) -> Validation:
    v = Validation(plan=plan.model_copy(deep=True))
    p = v.plan

    for name in p.metrics:
        if name not in sl.metrics:
            v.errors.append(Issue("unknown_metric", f"Metric '{name}' is not defined in the semantic layer.", _suggest(name, _metric_choices(sl))))
    dims_used = list(dict.fromkeys(p.dimensions + [f.dimension for f in p.filters]))
    for d in dims_used:
        if d not in sl.dimensions:
            v.errors.append(Issue("unknown_dimension", f"Dimension '{d}' is not defined.", _suggest(d, {norm(k): k for k in sl.dimensions})))
    if v.errors:
        return v

    for name in p.metrics:
        m = sl.metrics[name]
        for d in dims_used:
            if d not in m.allowed_dimensions:
                v.errors.append(Issue("dimension_not_allowed", f"Dimension '{d}' is not allowed for metric '{name}'. Allowed: {', '.join(m.allowed_dimensions)}.", m.allowed_dimensions[:6]))
        primary = m.numerator or m.component
        reach = reachable(sl, primary.entity, primary.joins_via)
        for d in p.dimensions:
            if not sl.dimensions[d].entities <= reach:
                v.errors.append(Issue("unreachable_dimension", f"Dimension '{d}' has no declared join path from metric '{name}'."))

    for s in p.sort:
        if s.field not in set(p.metrics) | set(p.dimensions):
            v.errors.append(Issue("bad_sort", f"Sort field '{s.field}' must be one of the plan's metrics or dimensions."))

    # filter values
    fixed: list[Filter] = []
    for f in p.filters:
        d = sl.dimensions[f.dimension]
        vals = []
        for raw in f.values:
            if f.dimension == "campaign":
                if raw.lower() in ("latest", "ultima", "última", "last"):
                    vals.append(latest_closed_campaign())
                    v.notes.append(Issue("resolved_value", f"'{raw}' campaign resolved to {vals[-1]} (latest closed season as of {settings.as_of})."))
                    continue
                m = CAMPAIGN.match(raw.strip())
                if m:
                    raw = f"{m.group(1)}/{m.group(2)[-2:]}"
            if d.is_timestamp:
                if not ISO_DATE.match(raw):
                    v.errors.append(Issue("bad_date", f"Filter on '{f.dimension}' needs ISO dates (YYYY-MM-DD), got '{raw}'."))
                vals.append(raw if len(raw) == 10 else raw + "-01")
                continue
            canon, sugg, fuzzy = resolve(sl, f.dimension, raw)
            if canon is None:
                v.errors.append(Issue("unknown_value", f"Value '{raw}' does not exist for '{f.dimension}'.", sugg))
            else:
                if fuzzy:
                    v.notes.append(Issue("fuzzy_value", f"Interpreted '{raw}' as '{canon}' for {f.dimension}."))
                vals.append(canon)
        fixed.append(Filter(dimension=f.dimension, op=f.op, values=vals or f.values))
    p.filters = fixed

    if p.limit and p.limit > settings.row_limit:
        p.limit = settings.row_limit
    if v.errors:
        return v

    # required filter-or-group (e.g. standard-dependent metrics)
    for name in p.metrics:
        for req in sl.metrics[name].requires_filter_or_group:
            grouped = req in p.dimensions
            vals = p.filter_values(req)
            if not grouped and not (vals and len(vals) == 1):
                msg = sl.result_checks.get("required_filters_message", {})
                options = get_values().get(req, [])
                if req == "standard":
                    options = _standards_with_data(sl, name) or options
                v.clarification = Clarification(req, {"he": msg.get("he", f"איזה {req}?"), "en": msg.get("en", f"Which {req}?")}, options)
                return v
    return v


_std_cache: dict[str, list[str]] = {}


def _standards_with_data(sl: SemanticLayer, metric: str) -> list[str]:
    """Standards that actually have rows for this metric's entity."""
    if metric in _std_cache:
        return _std_cache[metric]
    from .executor import execute

    m = sl.metrics[metric]
    c = m.numerator or m.component
    ent = "compliance_evaluation" if c.entity in ("lot_origin", "compliance_evaluation") else c.entity
    table = sl.entities[ent].table
    try:
        rows = execute(f"select distinct standard_id from {table} order by 1", []).rows
        _std_cache[metric] = [r[0] for r in rows]
    except Exception:
        _std_cache[metric] = []
    return _std_cache[metric]
