"""Deterministic QueryPlan -> SQL compiler.

Rules
- Joins come only from `relationships` in the semantic layer (many-to-one,
  walked from the metric's entity). One-to-many hops are allowed only through
  entities a metric lists in `joins_via`.
- Each aggregate (component) is its own CTE; ratios are ratios of sums.
- A filter or grouping on a dimension a component cannot reach is not applied
  to that component (e.g. the total-volume denominator ignores `standard`).
- Same plan -> byte-identical SQL (no dict-order or set-order dependence).

The SQL is valid on both Postgres and DuckDB.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field

from .config import settings
from .plan import Filter, QueryPlan
from .semantic import Component, Metric, Relationship, SemanticLayer, refs


class CompileError(Exception):
    pass


@dataclass
class Join:
    alias: str
    table: str
    on: str


@dataclass
class CompiledQuery:
    sql: str
    params: list
    display_sql: str
    tables: list[str]
    columns: list[str]
    dims: list[str]
    metrics: list[str]
    truncation_limit: int = 0


@dataclass
class _Ctx:
    sl: SemanticLayer
    params: list = field(default_factory=list)
    display: list = field(default_factory=list)

    def param(self, value: str, cast: str | None = None) -> tuple[str, str]:
        self.params.append(value)
        p = f"${len(self.params)}"
        lit = "'" + str(value).replace("'", "''") + "'"
        if cast:
            return f"cast({p} as {cast})", f"cast({lit} as {cast})"
        return p, lit


# Joins
def _edges(sl: SemanticLayer, via: tuple[str, ...]):
    """Adjacency list in declaration order: (neighbor, relationship, forward?)."""
    adj: dict[str, list[tuple[str, Relationship, bool]]] = {}
    for r in sl.relationships:
        adj.setdefault(r.from_entity, []).append((r.to_entity, r, True))
        if r.from_entity in via:  # one-to-many hop, only when declared
            adj.setdefault(r.to_entity, []).append((r.from_entity, r, False))
    return adj


def join_path(sl: SemanticLayer, base: str, needed: set[str], via: tuple[str, ...] = ()) -> list[Join]:
    adj = _edges(sl, via)
    parent: dict[str, tuple[str, Relationship, bool]] = {}
    seen = {base}
    order = [base]
    q = deque([base])
    while q:
        cur = q.popleft()
        for nxt, rel, fwd in adj.get(cur, []):
            if nxt not in seen:
                seen.add(nxt)
                parent[nxt] = (cur, rel, fwd)
                order.append(nxt)
                q.append(nxt)
    missing = needed - seen
    if missing:
        raise CompileError(f"no declared join path from {base} to {sorted(missing)}")
    use: set[str] = set()
    for n in needed:
        while n != base:
            use.add(n)
            n = parent[n][0]
    joins = []
    for n in order:  # BFS order => parents before children, deterministic
        if n not in use:
            continue
        p, rel, fwd = parent[n]
        if fwd:
            on = f"{n}.{rel.to_col} = {p}.{rel.from_col}"
        else:
            on = f"{n}.{rel.from_col} = {p}.{rel.to_col}"
        joins.append(Join(alias=n, table=sl.entities[n].table, on=on))
    return joins


def reachable(sl: SemanticLayer, base: str, via: tuple[str, ...] = ()) -> set[str]:
    adj = _edges(sl, via)
    seen, q = {base}, deque([base])
    while q:
        for nxt, _r, _f in adj.get(q.popleft(), []):
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return seen


# Pieces
def _agg(c: Component) -> str:
    if c.type == "sum":
        return f"sum({c.expr})"
    if c.type == "count":
        return f"count({c.expr})"
    if c.type == "count_distinct":
        return f"count(distinct {c.expr})"
    if c.type == "median":
        return f"percentile_cont(0.5) within group (order by {c.expr})"
    raise CompileError(f"unsupported aggregate {c.type}")


def _filter_sql(ctx: _Ctx, f: Filter) -> tuple[str, str]:
    d = ctx.sl.dimensions[f.dimension]
    cast = "timestamp" if d.is_timestamp else None
    vals = [ctx.param(v, cast) for v in f.values]
    if f.op in ("in", "not_in"):
        neg = " not" if f.op == "not_in" else ""
        return (f"{d.expr}{neg} in ({', '.join(v[0] for v in vals)})", f"{d.expr}{neg} in ({', '.join(v[1] for v in vals)})")
    if f.op == "gte":
        return f"{d.expr} >= {vals[0][0]}", f"{d.expr} >= {vals[0][1]}"
    if f.op == "lte":
        return f"{d.expr} <= {vals[0][0]}", f"{d.expr} <= {vals[0][1]}"
    if f.op == "between":
        if len(vals) != 2:
            raise CompileError("between needs two values")
        return f"{d.expr} between {vals[0][0]} and {vals[1][0]}", f"{d.expr} between {vals[0][1]} and {vals[1][1]}"
    raise CompileError(f"unsupported op {f.op}")


@dataclass
class _CTE:
    name: str
    sql: str
    display: str
    dims: list[str]
    tables: list[str]


def _component_cte(ctx: _Ctx, name: str, c: Component, plan: QueryPlan) -> _CTE:
    sl = ctx.sl
    ents = set(sl.entities)
    reach = reachable(sl, c.entity, c.joins_via)
    dims = [d for d in plan.dimensions if sl.dimensions[d].entities <= reach]
    plan_filters = [f for f in plan.filters if sl.dimensions[f.dimension].entities <= reach]

    needed = set()
    for e in [c.expr, *c.filters, c.distinct_on or ""]:
        needed |= refs(e, ents)
    for d in dims:
        needed |= sl.dimensions[d].entities
    for f in plan_filters:
        needed |= sl.dimensions[f.dimension].entities
    needed.discard(c.entity)
    joins = join_path(sl, c.entity, needed, c.joins_via)

    base = sl.entities[c.entity]
    from_lines = [f"from {base.table} as {c.entity}"] + [f"left join {j.table} as {j.alias} on {j.on}" for j in joins]
    where, where_d = list(c.filters), list(c.filters)
    for f in plan_filters:
        s, dsp = _filter_sql(ctx, f)
        where.append(s)
        where_d.append(dsp)

    dim_sel = [f"{sl.dimensions[d].expr} as {d}" for d in dims]
    group = [sl.dimensions[d].expr for d in dims]

    def render(wh: list[str]) -> str:
        w = ("\n  where " + "\n    and ".join(wh)) if wh else ""
        if c.type == "sum_distinct":
            inner = ",\n      ".join(dim_sel + [f"{c.distinct_on} as distinct_key", f"max({c.expr}) as v"])
            ig = ", ".join(group + [c.distinct_on])
            fl = "\n    ".join(from_lines)
            wi = ("\n    where " + "\n      and ".join(wh)) if wh else ""
            outer_sel = ", ".join(dims + ["sum(v) as value"])
            og = (" group by " + ", ".join(dims)) if dims else ""
            return f"select {outer_sel} from (\n    select {inner}\n    {fl}{wi}\n    group by {ig}\n  ) as s{og}"
        sel = ",\n    ".join(dim_sel + [f"{_agg(c)} as value"])
        g = ("\n  group by " + ", ".join(group)) if group else ""
        fl = "\n  ".join(from_lines)
        return f"select\n    {sel}\n  {fl}{w}{g}"

    return _CTE(name, render(where), render(where_d), dims, [base.table] + [j.table for j in joins])


def _metric_expr(m: Metric, cte_for: dict[str, _CTE]) -> str:
    if m.type == "ratio":
        n = cte_for[m.numerator.key()].name
        d = cte_for[m.denominator.key()].name
        return f"cast(coalesce({n}.value, 0) as double precision) / nullif({d}.value, 0)"
    c = cte_for[m.component.key()].name
    if m.type in ("sum", "count", "count_distinct", "sum_distinct"):
        return f"coalesce({c}.value, 0)"
    return f"{c}.value"


def compile_plan(sl: SemanticLayer, plan: QueryPlan, limit: int | None = None) -> CompiledQuery:
    for name in plan.metrics:
        if name not in sl.metrics:
            raise CompileError(f"unknown metric {name}")
    for d in plan.dimensions + [f.dimension for f in plan.filters]:
        if d not in sl.dimensions:
            raise CompileError(f"unknown dimension {d}")

    ctx = _Ctx(sl)
    ctes: list[_CTE] = []
    cte_for: dict[str, _CTE] = {}
    for mname in plan.metrics:
        for c in sl.metrics[mname].components:
            k = c.key()
            if k not in cte_for:
                cte = _component_cte(ctx, f"c{len(ctes) + 1}", c, plan)
                ctes.append(cte)
                cte_for[k] = cte

    dims = list(plan.dimensions)
    full = [c for c in ctes if c.dims == dims]
    if dims and not full:
        raise CompileError("no metric can be grouped by all requested dimensions")

    def assemble(use_display: bool) -> str:
        parts = [f"{c.name} as (\n  {c.display if use_display else c.sql}\n)" for c in ctes]
        if dims:
            spine = "\n  union\n  ".join(f"select {', '.join(dims)} from {c.name}" for c in full)
            parts.append(f"spine as (\n  {spine}\n)")
        sel = [f"spine.{d} as {d}" for d in dims] + [f"{_metric_expr(sl.metrics[m], cte_for)} as {m}" for m in plan.metrics]
        if dims:
            frm = ["from spine"]
            for c in ctes:
                if c.dims:
                    on = " and ".join(f"{c.name}.{d} is not distinct from spine.{d}" for d in c.dims)
                    frm.append(f"left join {c.name} on {on}")
                else:
                    frm.append(f"cross join {c.name}")
        else:
            frm = [f"from {ctes[0].name}"] + [f"cross join {c.name}" for c in ctes[1:]]
        order = _order_by(sl, plan)
        cap = min(limit or plan.limit or settings.row_limit, settings.row_limit) + 1
        body = "select\n  " + ",\n  ".join(sel) + "\n" + "\n".join(frm)
        if order:
            body += "\norder by " + ", ".join(order)
        body += f"\nlimit {cap}"
        return "with " + ",\n".join(parts) + "\n" + body

    tables = sorted({t for c in ctes for t in c.tables})
    return CompiledQuery(
        sql=assemble(False),
        params=ctx.params,
        display_sql=assemble(True),
        tables=tables,
        columns=dims + list(plan.metrics),
        dims=dims,
        metrics=list(plan.metrics),
        truncation_limit=min(limit or plan.limit or settings.row_limit, settings.row_limit),
    )


def _order_by(sl: SemanticLayer, plan: QueryPlan) -> list[str]:
    out: list[str] = []
    valid = set(plan.dimensions) | set(plan.metrics)
    for s in plan.sort:
        if s.field in valid:
            out.append(f"{s.field} {s.direction} nulls last")
    if not out:
        time_dims = [d for d in plan.dimensions if sl.dimensions[d].type == "time"]
        if time_dims:
            out.append(f"{time_dims[0]} asc")
        elif plan.dimensions:
            out.append(f"{plan.metrics[0]} desc nulls last")
    out += [f"{d} asc" for d in plan.dimensions if not any(o.startswith(d + " ") for o in out)]
    return out


def compile_sample(sl: SemanticLayer, plan: QueryPlan, n: int = 8) -> CompiledQuery:
    """Source rows behind the first metric (for the lineage panel)."""
    m = sl.metrics[plan.metrics[0]]
    c = m.numerator or m.component
    ctx = _Ctx(sl)
    ents = set(sl.entities)
    reach = reachable(sl, c.entity, c.joins_via)
    dims = [d for d in plan.dimensions if sl.dimensions[d].entities <= reach]
    plan_filters = [f for f in plan.filters if sl.dimensions[f.dimension].entities <= reach]
    needed = set()
    for e in [c.expr, *c.filters, c.distinct_on or ""]:
        needed |= refs(e, ents)
    for d in dims:
        needed |= sl.dimensions[d].entities
    for f in plan_filters:
        needed |= sl.dimensions[f.dimension].entities
    needed.discard(c.entity)
    joins = join_path(sl, c.entity, needed, c.joins_via)
    base = sl.entities[c.entity]
    pk = [f"{c.entity}.{k}" for k in base.primary_key]
    sel = pk + [f"{sl.dimensions[d].expr} as {d}" for d in dims] + [f"{c.expr} as measure_value"]
    if c.entity not in ("lot_origin", "program_standard"):
        sel.append(f"{c.entity}.data_origin")
    where, where_d = list(c.filters), list(c.filters)
    for f in plan_filters:
        s, dsp = _filter_sql(ctx, f)
        where.append(s)
        where_d.append(dsp)
    frm = [f"from {base.table} as {c.entity}"] + [f"left join {j.table} as {j.alias} on {j.on}" for j in joins]

    def render(wh):
        w = ("\nwhere " + "\n  and ".join(wh)) if wh else ""
        return "select\n  " + ",\n  ".join(sel) + "\n" + "\n".join(frm) + w + f"\norder by {', '.join(pk)}\nlimit {n}"

    return CompiledQuery(render(where), ctx.params, render(where_d), [base.table] + [j.table for j in joins], [], dims, [plan.metrics[0]])
