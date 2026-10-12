"""Rule-based chart selection. The planner may suggest a chart; rules decide."""

from __future__ import annotations

from .executor import Result
from .geo import GEO_DIMS
from .plan import QueryPlan
from .semantic import SemanticLayer

MAX_SERIES = 8
MAX_BARS = 25


def choose(sl: SemanticLayer, plan: QueryPlan, result: Result) -> dict:
    dims = plan.dimensions
    metrics = plan.metrics
    n = len(result.rows)
    time_dims = [d for d in dims if sl.dimensions[d].type == "time"]
    primary = metrics[0]
    spec = {
        "type": "table",
        "x": None,
        "series": None,
        "y": primary,
        "metrics": metrics,
        "reason": "",
    }

    def distinct(col: str) -> int:
        i = result.columns.index(col)
        return len({r[i] for r in result.rows})

    if not dims:
        spec.update(type="kpi", reason="no dimensions -> KPI")
    elif len(dims) == 1 and time_dims:
        spec.update(type="line", x=dims[0], reason="one time dimension -> line")
    elif len(dims) == 1 and dims[0] in GEO_DIMS and n >= 2:
        spec.update(type="map", x=dims[0], reason="one geographic dimension -> map (bar view available)")
    elif len(dims) == 1:
        if n <= MAX_BARS:
            spec.update(type="bar", x=dims[0], reason="one category -> bar, sorted")
        else:
            spec.update(reason=f"{n} categories > {MAX_BARS} -> table")
    elif len(dims) == 2:
        if time_dims:
            other = next(d for d in dims if d != time_dims[0])
            if distinct(other) <= MAX_SERIES:
                spec.update(type="line", x=time_dims[0], series=other, reason="time + one category -> line per series")
            else:
                spec.update(reason="too many series -> table")
        else:
            a, b = dims
            if distinct(b) > MAX_SERIES and distinct(a) <= MAX_SERIES:
                a, b = b, a
            if distinct(b) <= MAX_SERIES and distinct(a) <= MAX_BARS:
                stacked = plan.chart_hint == "stacked_bar" and sl.metrics[primary].additive
                spec.update(type="stacked_bar" if stacked else "grouped_bar", x=a, series=b, reason="two categories -> grouped bars")
            else:
                spec.update(reason="too many categories -> table")
    else:
        spec.update(reason="three dimensions -> table")

    if plan.chart_hint == "table":
        spec.update(type="table", reason=spec["reason"] + "; planner asked for a table")
    spec["unit"] = sl.metrics[primary].unit
    return spec
