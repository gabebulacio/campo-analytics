"""Answer pipeline: explicit stages, each timed and logged under one trace id.

normalize -> (cache) -> match_verified -> route -> plan -> validate -> compile
-> execute -> check_result -> visualize -> explain -> package
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
import uuid
from collections import OrderedDict
from datetime import datetime, timezone

from . import checks, explain, llm, semantic, verified, visualize
from .compiler import CompileError, compile_plan, compile_sample
from .config import settings
from .executor import ExecutionError, execute
from .plan import QueryPlan
from .semantic import SemanticLayer
from .validator import validate

log = logging.getLogger("pipeline")

TRACES: OrderedDict[str, dict] = OrderedDict()
CACHE: dict[str, dict] = {}
MAX_TRACES = 500


class Trace:
    def __init__(self, question: str):
        self.id = uuid.uuid4().hex[:12]
        self.question = question
        self.started = time.perf_counter()
        self.stages: list[dict] = []
        self.usage = llm.Usage()

    def stage(self, name: str, t0: float, **data) -> None:
        ms = int((time.perf_counter() - t0) * 1000)
        entry = {"stage": name, "ms": ms, **data}
        self.stages.append(entry)
        log.info(json.dumps({"trace_id": self.id, **entry}, default=str, ensure_ascii=False)[:2000])

    @property
    def elapsed_ms(self) -> int:
        return int((time.perf_counter() - self.started) * 1000)


def _store(trace: Trace, answer: dict) -> None:
    rec = {"trace_id": trace.id, "at": datetime.now(timezone.utc).isoformat(), "question": trace.question, "stages": trace.stages, "answer": answer}
    TRACES[trace.id] = rec
    while len(TRACES) > MAX_TRACES:
        TRACES.popitem(last=False)
    try:
        settings.traces_path.parent.mkdir(parents=True, exist_ok=True)
        with settings.traces_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, default=str, ensure_ascii=False) + "\n")
    except OSError:
        pass


def get_trace(trace_id: str) -> dict | None:
    if trace_id in TRACES:
        return TRACES[trace_id]
    if settings.traces_path.exists():
        with settings.traces_path.open(encoding="utf-8") as fh:
            for line in fh:
                if f'"trace_id": "{trace_id}"' in line:
                    return json.loads(line)
    return None


def _cache_key(q: str, clar: str | None, version: str) -> str:
    return hashlib.sha256(f"{' '.join(q.lower().split())}|{clar or ''}|{version}".encode()).hexdigest()


# ------------------------------------------------------------------ lineage
def _metric_def(sl: SemanticLayer, name: str) -> dict:
    m = sl.metrics[name]

    def comp(c):
        if not c:
            return None
        agg = {"sum": "SUM", "count": "COUNT", "count_distinct": "COUNT DISTINCT", "sum_distinct": "SUM (distinct per {})".format(c.distinct_on), "median": "MEDIAN"}[c.type]
        return {"aggregate": agg, "expr": c.expr, "entity": c.entity, "table": sl.entities[c.entity].table, "filters": list(c.filters)}

    return {
        "name": name, "label": m.label, "description": m.description, "type": m.type, "unit": m.unit, "workspace": m.workspace,
        "component": comp(m.component), "numerator": comp(m.numerator), "denominator": comp(m.denominator),
        "numerator_metric": m.numerator_ref, "denominator_metric": m.denominator_ref,
        "requires_filter_or_group": m.requires_filter_or_group, "checks": m.checks,
    }


def _upstream(sl: SemanticLayer, tables: list[str]) -> list[dict]:
    out = []
    for t in tables:
        e = sl.entity_of_table(t)
        if e:
            out.append({"table": t, "entity": e.name, "grain": e.grain, "source": e.source or "seeded reference data"})
    return out


def _column_meta(sl: SemanticLayer, plan: QueryPlan) -> list[dict]:
    meta = [{"name": d, "kind": "dimension", "label": sl.dimensions[d].label, "time": sl.dimensions[d].type == "time"} for d in plan.dimensions]
    meta += [{"name": m, "kind": "metric", "label": sl.metrics[m].label, "unit": sl.metrics[m].unit} for m in plan.metrics]
    return meta


# ------------------------------------------------------------------ main
def answer(question: str, clarification: str | None = None, lang: str | None = None, pending_plan: dict | None = None, dimension: str | None = None) -> dict:
    sl = semantic.get()
    if pending_plan and dimension and clarification:
        # validator-driven clarification (e.g. which standard): apply the choice deterministically
        trace = Trace(f"{question} [→ {clarification}]")
        language = lang or verified.detect_lang(question)
        base = {"trace_id": trace.id, "question": question, "clarification": clarification, "language": language,
                "as_of": str(settings.as_of), "semantic_version": sl.version, "engine": settings.engine}
        t0 = time.perf_counter()
        try:
            p = QueryPlan.model_validate(pending_plan)
        except Exception as e:
            return _finish(trace, {**base, **_not_answered("validation_failed", {"es": f"Plan inválido: {e}", "en": f"Invalid plan: {e}"}, [], sl)})
        from .plan import Filter
        p.filters = [f for f in p.filters if f.dimension != dimension] + [Filter(dimension=dimension, values=[clarification])]
        trace.stage("apply_clarification", t0, dimension=dimension, value=clarification)
        return _execute_plan(sl, trace, base, p, tier="GOVERNED", language=language)
    question = (question or "").strip()[:500]
    trace = Trace(question + (f" [→ {clarification}]" if clarification else ""))

    # 1. normalize
    t0 = time.perf_counter()
    language = lang or verified.detect_lang(question)
    effective_q = question if not clarification else f"{question}\n(Aclaración del usuario / user clarification: {clarification})"
    unsafe = verified.looks_unsafe(question) or (clarification and verified.looks_unsafe(clarification))
    trace.stage("normalize", t0, language=language, as_of=str(settings.as_of), unsafe_pattern=bool(unsafe))

    base = {"trace_id": trace.id, "question": question, "clarification": clarification, "language": language,
            "as_of": str(settings.as_of), "semantic_version": sl.version, "engine": settings.engine}

    if not question:
        return _finish(trace, {**base, **_not_answered("empty", {"es": "Escribí una pregunta.", "en": "Type a question."}, [], sl)})

    key = _cache_key(question, clarification, sl.version)
    if key in CACHE:
        t0 = time.perf_counter()
        cached = json.loads(json.dumps(CACHE[key]))
        trace.stage("cache", t0, hit=True, original_trace=cached["trace_id"])
        cached.update(trace_id=trace.id, cached_from=cached["trace_id"], latency_ms=trace.elapsed_ms, cost={"usd": 0.0, "input_tokens": 0, "output_tokens": 0})
        cached["stages"] = trace.stages
        _store(trace, cached)
        return cached

    if unsafe:
        return _finish(trace, {**base, **_not_answered("unsafe", {
            "es": "No puedo hacer eso. Solo respondo preguntas de análisis con métricas definidas, y el acceso a los datos es de solo lectura.",
            "en": "I can't do that. I only answer analytics questions with defined metrics, and data access is read-only."}, [], sl)})

    # 2. verified query match (deterministic, before any LLM call)
    t0 = time.perf_counter()
    vmatch, near = verified.match(sl, effective_q if not clarification else question)
    trace.stage("match_verified", t0, matched=vmatch.id if vmatch else None, score=round(vmatch.score, 1) if vmatch else None,
                near=[(n.id, round(n.score, 1)) for n in near])
    if vmatch and not clarification:
        notes = []
        for pname, val in vmatch.params.items():
            notes.append({"code": "verified_param", "level": "info", "message": {"es": f"Parámetro {pname}: {val}", "en": f"Parameter {pname}: {val}"}})
        return _execute_plan(sl, trace, base, vmatch.plan, tier="VERIFIED", language=language, verified_info={
            "id": vmatch.id, "owner": vmatch.owner, "verified_at": vmatch.verified_at, "canonical_question": vmatch.question, "params": vmatch.params, "score": round(vmatch.score, 1)}, extra_warnings=notes, cache_key=key)

    # 3. route + 4. plan (LLM)
    if not settings.anthropic_api_key:
        sugg = [{"metric": None, "question": n.question, "verified_query_id": n.id} for n in near]
        return _finish(trace, {**base, **_not_answered("llm_unavailable", {
            "es": "El planificador con IA no está configurado (falta ANTHROPIC_API_KEY). Solo puedo responder las preguntas verificadas; probá una de las sugeridas.",
            "en": "The AI planner is not configured (ANTHROPIC_API_KEY missing). I can only answer verified questions; try a suggested one."}, [], sl, suggestions=sugg)})

    try:
        t0 = time.perf_counter()
        r = llm.route(sl, effective_q, trace.usage)
        trace.stage("route", t0, **r)
        language = lang or r.get("language", language)
        base["language"] = language
        if r["intent"] == "unsafe":
            return _finish(trace, {**base, **_not_answered("unsafe", {
                "es": "No puedo hacer eso. Solo respondo preguntas de análisis con métricas definidas, y el acceso a los datos es de solo lectura.",
                "en": "I can't do that. I only answer analytics questions with defined metrics, and data access is read-only."}, [], sl)})
        if r["intent"] == "out_of_scope":
            gap = next((g for g in sl.known_gaps if g["topic"] == r.get("gap_topic")), None)
            closest = gap["closest"] if gap else []
            reason = gap["reason"] if gap else "No metric in the semantic layer covers this question."
            return _finish(trace, {**base, **_not_answered("out_of_scope", {
                "es": f"No tengo una métrica para eso. {_es_reason(reason)}", "en": f"I don't have a metric for that. {reason}"}, closest, sl)})

        t0 = time.perf_counter()
        outcome = llm.plan(sl, effective_q, r["workspace"], trace.usage, allow_clarification=clarification is None)
        trace.stage("plan", t0, kind=outcome.kind, plan=outcome.plan.model_dump() if outcome.plan else None, repairs=outcome.repairs,
                    tool_calls=outcome.tool_calls, reason=outcome.reason or None)
    except llm.LLMUnavailable as e:
        return _finish(trace, {**base, **_not_answered("llm_unavailable", {"es": str(e), "en": str(e)}, [], sl)})
    except Exception as e:  # API/network failure: fail loudly, never guess
        log.exception("llm failure")
        trace.stage("llm_error", time.perf_counter(), error=f"{type(e).__name__}: {e}")
        return _finish(trace, {**base, **_not_answered("llm_error", {
            "es": "El servicio de IA no respondió. Probá de nuevo en unos segundos.", "en": "The AI service did not respond. Try again in a few seconds."}, [], sl)})

    if outcome.kind == "clarification":
        return _finish(trace, {**base, "status": "clarification", "tier": None, "summary": outcome.question,
                               "clarify": {"question": outcome.question, "options": outcome.options}, "warnings": []})
    if outcome.kind == "refusal":
        return _finish(trace, {**base, **_not_answered("refused", {"es": outcome.reason, "en": outcome.reason}, outcome.closest, sl)})
    if outcome.kind != "plan":
        return _finish(trace, {**base, **_not_answered("validation_failed", {
            "es": f"No pude armar una consulta válida con las métricas definidas ({outcome.reason}).",
            "en": f"I couldn't build a valid query from the defined metrics ({outcome.reason})."}, [], sl)})

    notes = [{"code": n["code"], "level": "info", "message": {"es": n["message"], "en": n["message"]}} for n in outcome.validation_notes]
    return _execute_plan(sl, trace, base, outcome.plan, tier="GOVERNED", language=language, extra_warnings=notes, cache_key=key)


def _es_reason(reason: str) -> str:
    return {
        "No credit issuance or registry entity modeled.": "No hay datos de emisión ni registro de créditos de carbono.",
        "No financial entities modeled.": "No hay datos financieros (precios, primas, pagos).",
        "Not captured in Crop Story fields.": "Ese dato no se registra en el Crop Story.",
        "Model is descriptive; no forecast entity.": "El modelo es descriptivo; no incluye pronósticos.",
    }.get(reason, reason)


def _execute_plan(sl, trace, base, plan: QueryPlan, tier: str, language: str, verified_info=None, extra_warnings=None, cache_key=None) -> dict:
    # 5. validate (verified plans go through the same validator)
    t0 = time.perf_counter()
    v = validate(sl, plan)
    trace.stage("validate", t0, ok=v.ok, errors=[e.as_dict() for e in v.errors], clarification=v.clarification.dimension if v.clarification else None)
    if v.clarification:
        c = v.clarification
        return _finish(trace, {**base, "status": "clarification", "tier": None, "summary": c.question[language],
                               "clarify": {"question": c.question[language], "options": c.options, "dimension": c.dimension}, "warnings": [],
                               "pending_plan": plan.model_dump()})
    if v.errors:
        return _finish(trace, {**base, **_not_answered("validation_failed", {
            "es": "La consulta no pasó la validación: " + "; ".join(e.message for e in v.errors),
            "en": "The query failed validation: " + "; ".join(e.message for e in v.errors)}, [], sl)})
    plan = v.plan

    # 6. compile
    t0 = time.perf_counter()
    try:
        q = compile_plan(sl, plan)
    except CompileError as e:
        trace.stage("compile", t0, error=str(e))
        return _finish(trace, {**base, **_not_answered("compile_failed", {"es": f"No se pudo compilar la consulta: {e}", "en": f"Could not compile the query: {e}"}, [], sl)})
    trace.stage("compile", t0, sql=q.display_sql, params=q.params, tables=q.tables)

    # 7. execute
    t0 = time.perf_counter()
    try:
        res = execute(q.sql, q.params, q.display_sql)
    except ExecutionError as e:
        trace.stage("execute", t0, error=str(e))
        return _finish(trace, {**base, **_not_answered("execution_failed", {"es": f"La consulta falló al ejecutarse: {e}", "en": f"The query failed: {e}"}, [], sl)})
    trace.stage("execute", t0, rows=len(res.rows), db_ms=res.elapsed_ms, truncated=res.truncated, engine=settings.engine)

    # 8. checks
    t0 = time.perf_counter()
    warnings = list(extra_warnings or []) + checks.run(sl, plan, res)
    trace.stage("check_result", t0, warnings=[w["code"] for w in warnings])

    # 9. visualize
    t0 = time.perf_counter()
    chart = visualize.choose(sl, plan, res)
    trace.stage("visualize", t0, chart=chart["type"], reason=chart["reason"])

    # 10. explain
    t0 = time.perf_counter()
    summary = {lng: explain.summarize(sl, plan, res, lng) for lng in ("es", "en")}
    trace.stage("explain", t0, summary=summary[language])

    # lineage sample rows
    t0 = time.perf_counter()
    sample = None
    try:
        sq = compile_sample(sl, plan)
        sr = execute(sq.sql, sq.params, sq.display_sql)
        sample = {"sql": sq.display_sql, "columns": sr.columns, "rows": sr.rows}
    except (CompileError, ExecutionError) as e:
        sample = {"error": str(e)}
    trace.stage("sample_rows", t0, rows=len(sample.get("rows", [])) if sample else 0)

    ans = {
        **base,
        "status": "answered",
        "tier": tier,
        "summary": summary[language],
        "summary_i18n": summary,
        "chart": chart,
        "data": {"columns": res.columns, "rows": res.rows, "meta": _column_meta(sl, plan), "truncated": res.truncated},
        "warnings": warnings,
        "plan": plan.model_dump(),
        "lineage": {
            "metrics": [_metric_def(sl, m) for m in plan.metrics],
            "plan": plan.model_dump(),
            "sql": q.display_sql,
            "params": q.params,
            "source_tables": q.tables,
            "upstream": _upstream(sl, q.tables),
            "row_count": len(res.rows),
            "sample": sample,
            "as_of": str(settings.as_of),
            "semantic_version": sl.version,
            "verified_query": verified_info,
            "engine": settings.engine,
            "data_origin": "synthetic producer data (public reference layers: Phase 1b)",
        },
    }
    out = _finish(trace, ans)
    if cache_key and tier in ("VERIFIED", "GOVERNED"):
        CACHE[cache_key] = json.loads(json.dumps(out, default=str))
    return out


def _not_answered(code: str, message: dict, closest: list[str], sl: SemanticLayer, suggestions: list | None = None) -> dict:
    close = []
    for name in closest:
        m = sl.metrics.get(name)
        if m:
            close.append({"metric": name, "label": m.label, "description": m.description,
                          "question": {"es": f"Mostrame {m.label['es'].lower()}", "en": f"Show me {m.label['en'].lower()}"}})
    return {"status": "not_answered", "tier": "NOT_ANSWERED", "summary": message, "refusal": {"code": code, "message": message, "closest": close, "suggestions": suggestions or []}, "warnings": []}


def _finish(trace: Trace, ans: dict) -> dict:
    ans["latency_ms"] = trace.elapsed_ms
    ans["cost"] = trace.usage.as_dict()
    ans["stages"] = trace.stages
    if isinstance(ans.get("summary"), dict):
        ans["summary"] = ans["summary"].get(ans.get("language", "es"), next(iter(ans["summary"].values())))
    _store(trace, ans)
    return ans


def suggestions(lang: str = "es") -> list[dict]:
    sl = semantic.get()
    out = []
    for vq in sl.verified_queries:
        qs = vq["questions"].get(lang) or next(iter(vq["questions"].values()))
        q = qs[0].replace("{campaign}", "2024/25").replace("{standard}", "EUDR")
        ws = sl.metrics[vq["plan"]["metrics"][0]].workspace
        out.append({"question": q, "workspace": ws, "verified": True})
    extra = {
        "es": [("¿Cuántas hectáreas sembradas de soja hay por provincia en 2024/25?", "engagement"), ("¿Cuánto carbono capturamos?", "climate"),
               ("¿Cuántos créditos de carbono vendimos?", "climate"), ("Evolución de la tasa de respuesta por WhatsApp por mes", "engagement")],
        "en": [("Planted soy hectares by province in 2024/25", "engagement"), ("How much carbon do we capture?", "climate"),
               ("How many carbon credits did we sell?", "climate"), ("WhatsApp form response rate by month", "engagement")],
    }[lang if lang in ("es", "en") else "es"]
    out += [{"question": q, "workspace": w, "verified": False} for q, w in extra]
    return out
