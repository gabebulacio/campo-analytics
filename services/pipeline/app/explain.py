"""Summaries built only from result rows.

Every number in the text is formatted from a cell of the result (or a sum of
cells), never written by a model. tests/test_explain.py asserts this.
"""

from __future__ import annotations

from .executor import Result
from .fmt import number
from .plan import QueryPlan
from .semantic import SemanticLayer


def summarize(sl: SemanticLayer, plan: QueryPlan, result: Result, lang: str = "es") -> str:
    if not result.rows:
        return "No hay datos para esta consulta." if lang == "es" else "There is no data for this query."
    es = lang == "es"
    idx = {c: i for i, c in enumerate(result.columns)}
    m = sl.metrics[plan.metrics[0]]
    lab = m.label.get(lang, m.name)
    unit = m.unit
    filt = _filters_text(sl, plan, lang)

    if not plan.dimensions:
        parts = [f"{sl.metrics[x].label.get(lang, x)}: {number(result.rows[0][idx[x]], sl.metrics[x].unit, lang)}" for x in plan.metrics]
        return "; ".join(parts) + filt + "."

    dim = plan.dimensions[0]
    dlab = sl.dimensions[dim].label.get(lang, dim).lower()
    rows = [r for r in result.rows if r[idx[m.name]] is not None]
    if not rows:
        return ("Sin valores para " if es else "No values for ") + lab + "."

    if len(plan.dimensions) == 1 and sl.dimensions[dim].type == "time" and len(rows) >= 2:
        first, last = rows[0], rows[-1]
        a, b = first[idx[m.name]], last[idx[m.name]]
        verb = ("subió" if b > a else "bajó" if b < a else "se mantuvo") if es else ("rose" if b > a else "fell" if b < a else "held")
        if es:
            return f"{lab} {verb} de {number(a, unit, lang)} en {first[idx[dim]]} a {number(b, unit, lang)} en {last[idx[dim]]}{filt}."
        return f"{lab} {verb} from {number(a, unit, lang)} in {first[idx[dim]]} to {number(b, unit, lang)} in {last[idx[dim]]}{filt}."

    if len(plan.dimensions) == 1:
        top = max(rows, key=lambda r: r[idx[m.name]])
        bot = min(rows, key=lambda r: r[idx[m.name]])
        if es:
            s = f"{lab} por {dlab}: el valor más alto es {top[idx[dim]]} ({number(top[idx[m.name]], unit, lang)})"
            if len(rows) > 1:
                s += f" y el más bajo, {bot[idx[dim]]} ({number(bot[idx[m.name]], unit, lang)})"
        else:
            s = f"{lab} by {dlab}: highest is {top[idx[dim]]} ({number(top[idx[m.name]], unit, lang)})"
            if len(rows) > 1:
                s += f", lowest is {bot[idx[dim]]} ({number(bot[idx[m.name]], unit, lang)})"
        if m.additive and len(rows) > 1:
            total = sum(r[idx[m.name]] for r in rows)
            s += f". Total: {number(total, unit, lang)}"
        return s + filt + "."

    time_dims = [d for d in plan.dimensions if sl.dimensions[d].type == "time"]
    if len(plan.dimensions) == 2 and time_dims:
        t, other = time_dims[0], next(d for d in plan.dimensions if d != time_dims[0])
        last = max(str(r[idx[t]]) for r in rows)
        cur = [r for r in rows if str(r[idx[t]]) == last]
        hi = max(cur, key=lambda r: r[idx[m.name]])
        lo = min(cur, key=lambda r: r[idx[m.name]])
        if es:
            s = f"{lab} en {last}: el valor más alto es {hi[idx[other]]} ({number(hi[idx[m.name]], unit, lang)})"
            if len(cur) > 1:
                s += f" y el más bajo, {lo[idx[other]]} ({number(lo[idx[m.name]], unit, lang)})"
        else:
            s = f"{lab} in {last}: highest is {hi[idx[other]]} ({number(hi[idx[m.name]], unit, lang)})"
            if len(cur) > 1:
                s += f", lowest is {lo[idx[other]]} ({number(lo[idx[m.name]], unit, lang)})"
        return s + filt + "."

    top = max(rows, key=lambda r: r[idx[m.name]])
    combo = " · ".join(str(top[idx[d]]) for d in plan.dimensions)
    n = len(rows)
    if es:
        return f"{lab}: {number(n, 'count', lang)} combinaciones; la más alta es {combo} ({number(top[idx[m.name]], unit, lang)}){filt}."
    return f"{lab}: {number(n, 'count', lang)} combinations; highest is {combo} ({number(top[idx[m.name]], unit, lang)}){filt}."


def _filters_text(sl: SemanticLayer, plan: QueryPlan, lang: str) -> str:
    if not plan.filters:
        return ""
    bits = []
    for f in plan.filters:
        lab = sl.dimensions[f.dimension].label.get(lang, f.dimension)
        op = {"in": "", "not_in": "≠ ", "gte": "≥ ", "lte": "≤ ", "between": ""}[f.op]
        vals = " – ".join(f.values) if f.op == "between" else ", ".join(f.values)
        bits.append(f"{lab}: {op}{vals}")
    return " (" + "; ".join(bits) + ")"


def numbers_in(text: str) -> list[str]:
    import re

    return re.findall(r"\d[\d.,]*", text)
