"""Result checks. Failures become visible warnings on the answer, never hidden."""

from __future__ import annotations

from datetime import datetime

from .compiler import compile_plan
from .config import settings
from .executor import Result, execute
from .fmt import number
from .plan import QueryPlan
from .semantic import SemanticLayer


def _w(code: str, level: str, he: str, en: str) -> dict:
    return {"code": code, "level": level, "message": {"he": he, "en": en}}


def run(sl: SemanticLayer, plan: QueryPlan, result: Result) -> list[dict]:
    out: list[dict] = []
    if not result.rows:
        out.append(_w("empty", "warn", "השאילתה לא החזירה שורות. נסו להרחיב את המסננים או את התקופה.", "The query returned no rows. Try widening the filters or the period."))
        return out
    if result.truncated:
        out.append(_w("truncated", "warn", f"מוצגות {settings.row_limit:,} השורות הראשונות.", f"Showing the first {settings.row_limit:,} rows."))

    idx = {c: i for i, c in enumerate(result.columns)}
    for mname in plan.metrics:
        m = sl.metrics[mname]
        vals = [r[idx[mname]] for r in result.rows if r[idx[mname]] is not None]
        if not vals:
            continue
        lo, hi = m.checks.get("min"), m.checks.get("max")
        if lo is not None and min(vals) < lo:
            out.append(_w("bounds", "bad", f"{m.label['he']}: יש ערכים מתחת ל-{lo}, וזה לא אמור לקרות.", f"{m.label['en']}: values below {lo}, which should not happen."))
        if hi is not None and max(vals) > hi:
            bad = sum(1 for x in vals if x > hi)
            out.append(_w("bounds", "bad",
                          f"{m.label['he']}: {bad} ערכים חורגים מהמקסימום הצפוי ({number(hi, m.unit, 'he')}). בדקו את נתוני המקור לפני שמשתמשים במספר הזה.",
                          f"{m.label['en']}: {bad} value(s) exceed the expected maximum ({number(hi, m.unit, 'en')}). Check the source data before using this number."))
        other = m.checks.get("lte_metric")
        if other and other in idx:
            if any(r[idx[mname]] is not None and r[idx[other]] is not None and r[idx[mname]] > r[idx[other]] + 1e-6 for r in result.rows):
                out.append(_w("lte_metric", "bad", f"{m.label['he']} גבוה מ{sl.metrics[other].label['he']} בחלק מהשורות.", f"{m.label['en']} exceeds {sl.metrics[other].label['en']} in some row."))

    out += _reconcile(sl, plan, result, idx)
    out += _freshness(sl, plan)
    return out


def _reconcile(sl, plan, result, idx) -> list[dict]:
    """Breakdown by one dimension must add up to the unfiltered-by-dimension total."""
    if len(plan.dimensions) != 1 or result.truncated:
        return []
    cfg = sl.result_checks.get("reconciliation", {})
    tol = float(cfg.get("tolerance", 0.001))
    additive = [m for m in plan.metrics if sl.metrics[m].type in cfg.get("applies_to_types", ["sum", "count"])]
    if not additive:
        return []
    total_plan = QueryPlan(metrics=additive, dimensions=[], filters=plan.filters)
    q = compile_plan(sl, total_plan)
    tot = execute(q.sql, q.params, q.display_sql)
    out = []
    for m in additive:
        parts = sum(r[idx[m]] or 0 for r in result.rows)
        total = tot.rows[0][tot.columns.index(m)] or 0
        if total and abs(parts - total) / abs(total) > tol:
            lab = sl.metrics[m].label
            out.append(_w("reconciliation", "bad", f"{lab['he']}: הסכום לפי {plan.dimensions[0]} ({parts:,.1f}) לא תואם לסך הכול ({total:,.1f}).",
                          f"{lab['en']}: the sum by {plan.dimensions[0]} ({parts:,.1f}) does not match the total ({total:,.1f})."))
    return out


def _freshness(sl, plan) -> list[dict]:
    cfg = sl.result_checks.get("freshness", {})
    seen, out = set(), []
    for mname in plan.metrics:
        m = sl.metrics[mname]
        for c in m.components:
            ent = c.entity if c.entity in cfg else ("lot" if c.entity == "lot_origin" and "lot" in cfg else None)
            if not ent or ent in seen:
                continue
            seen.add(ent)
            col, cadence = cfg[ent]["column"], int(cfg[ent]["expected_cadence_days"])
            table = sl.entities[ent].table
            try:
                latest = execute(f"select max({col}) from {table}", []).rows[0][0]
            except Exception:
                continue
            if not latest:
                continue
            latest_dt = datetime.fromisoformat(latest if len(latest) > 7 else latest + "-01")
            age = (datetime.combine(settings.as_of, datetime.min.time()) - latest_dt).days
            if age > cadence:
                out.append(_w("freshness", "warn",
                              f"הנתונים של {ent} בני {age} ימים (טעינה אחרונה {latest_dt.date()}, תדירות צפויה: כל {cadence} ימים).",
                              f"{ent} data is {age} days old (last load {latest_dt.date()}, expected every {cadence} days)."))
    return out
