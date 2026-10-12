"""QueryPlan: the only thing the LLM is allowed to produce.

The JSON Schema exported from these models (packages/schemas/) is the shared
contract with the web app.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ChartType = Literal["kpi", "line", "bar", "grouped_bar", "stacked_bar", "table"]


class Filter(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dimension: str
    op: Literal["in", "not_in", "gte", "lte", "between"] = "in"
    values: list[str] = Field(min_length=1, max_length=50)


class Sort(BaseModel):
    model_config = ConfigDict(extra="forbid")
    field: str
    direction: Literal["asc", "desc"] = "desc"


class QueryPlan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metrics: list[str] = Field(min_length=1, max_length=4)
    dimensions: list[str] = Field(default_factory=list, max_length=3)
    filters: list[Filter] = Field(default_factory=list)
    sort: list[Sort] = Field(default_factory=list)
    limit: int | None = Field(default=None, ge=1, le=5000)
    chart_hint: ChartType | None = None

    def canonical(self) -> dict:
        """Order-insensitive form used for plan comparison in evals and caching."""
        return {
            "metrics": sorted(self.metrics),
            "dimensions": sorted(self.dimensions),
            "filters": sorted((f.dimension, f.op, tuple(sorted(v.lower() for v in f.values))) for f in self.filters),
        }

    def filter_values(self, dimension: str) -> list[str] | None:
        f = next((f for f in self.filters if f.dimension == dimension and f.op == "in"), None)
        return f.values if f else None


def plan_from_yaml(spec: dict) -> QueryPlan:
    """Convert the compact YAML plan form ({filters: {dim: value}}) to a QueryPlan."""
    filters = []
    for dim, val in (spec.get("filters") or {}).items():
        vals = val if isinstance(val, list) else [val]
        filters.append(Filter(dimension=dim, values=[str(v) for v in vals]))
    sort = [Sort(field=k, direction=v) for k, v in (spec.get("sort") or {}).items()]
    return QueryPlan(metrics=list(spec["metrics"]), dimensions=list(spec.get("dimensions", [])), filters=filters, sort=sort, limit=spec.get("limit"))
