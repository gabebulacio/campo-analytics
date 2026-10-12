"""FastAPI service: /ask, /catalog, /suggestions, /trace/{id}, /feedback, /evals/latest, /health."""

from __future__ import annotations

import json
import logging
import time
from collections import defaultdict
from datetime import date, datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import pipeline, semantic, values
from .config import settings
from .plan import QueryPlan

logging.basicConfig(level=logging.INFO, format="%(message)s")
app = FastAPI(title="AI Analytics Demo - pipeline", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=list(settings.cors_origins), allow_methods=["*"], allow_headers=["*"])

_hits: dict[tuple[str, date], int] = defaultdict(int)


class AskIn(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    clarification: str | None = Field(default=None, max_length=200)
    lang: str | None = Field(default=None, pattern="^(es|en)$")
    pending_plan: dict | None = None
    dimension: str | None = None


class FeedbackIn(BaseModel):
    trace_id: str
    rating: str = Field(pattern="^(up|down)$")
    comment: str | None = Field(default=None, max_length=1000)


def _client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (req.client.host if req.client else "unknown")


@app.get("/health")
def health():
    sl = semantic.get()
    db_ok = settings.duckdb_path.exists() if settings.engine == "duckdb" else True
    return {"status": "ok" if db_ok else "degraded", "engine": settings.engine, "database_ready": db_ok, "semantic_version": sl.version,
            "metrics": len(sl.metrics), "llm_configured": bool(settings.anthropic_api_key), "planner_model": settings.model_planner,
            "router_model": settings.model_fast, "as_of": str(settings.as_of), "time": datetime.now(timezone.utc).isoformat()}


@app.post("/ask")
def ask(body: AskIn, request: Request):
    ip = _client_ip(request)
    if settings.demo_mode and ip not in ("127.0.0.1", "::1", "localhost"):
        k = (ip, date.today())
        if _hits[k] >= settings.rate_limit_per_ip_per_day:
            raise HTTPException(429, detail={"es": "Llegaste al límite diario de preguntas de la demo.", "en": "Daily demo question limit reached."})
        _hits[k] += 1
    return pipeline.answer(body.question, body.clarification, body.lang, body.pending_plan, body.dimension)


@app.get("/catalog")
def catalog():
    sl = semantic.get()
    vals = values.get_values()
    return {
        "name": sl.name, "version": sl.version,
        "workspaces": [{"id": k, "label": v["label"], "description": " ".join(v["description"].split())} for k, v in sl.workspaces.items()],
        "metrics": [{"name": m.name, "label": m.label, "description": m.description, "type": m.type, "unit": m.unit, "workspace": m.workspace,
                     "workspaces": m.workspaces, "synonyms": m.synonyms, "allowed_dimensions": m.allowed_dimensions,
                     "requires_filter_or_group": m.requires_filter_or_group} for m in sl.metrics.values()],
        "dimensions": [{"name": d.name, "label": d.label, "type": d.type, "synonyms": list(d.synonyms), "values": vals.get(d.name)} for d in sl.dimensions.values()],
        "verified_queries": [{"id": v["id"], "questions": v["questions"], "owner": v.get("owner"), "verified_at": str(v.get("verified_at"))} for v in sl.verified_queries],
        "known_gaps": sl.known_gaps,
    }


@app.get("/suggestions")
def suggestions(lang: str = "es"):
    return pipeline.suggestions(lang)


@app.get("/trace/{trace_id}")
def trace(trace_id: str):
    t = pipeline.get_trace(trace_id)
    if not t:
        raise HTTPException(404, "trace not found")
    return t


@app.get("/traces")
def traces(limit: int = 30):
    items = list(pipeline.TRACES.values())[-limit:][::-1]
    return [{"trace_id": t["trace_id"], "at": t["at"], "question": t["question"], "status": t["answer"].get("status"),
             "tier": t["answer"].get("tier"), "latency_ms": t["answer"].get("latency_ms"), "usd": (t["answer"].get("cost") or {}).get("usd")} for t in items]


@app.post("/feedback")
def feedback(body: FeedbackIn):
    rec = {"at": datetime.now(timezone.utc).isoformat(), **body.model_dump()}
    t = pipeline.get_trace(body.trace_id)
    if t:
        rec["question"] = t["question"]
        rec["plan"] = (t["answer"] or {}).get("plan")
    path = settings.root / "data" / "out" / "feedback.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
    return {"ok": True}


@app.get("/evals/latest")
def evals_latest():
    if not settings.evals_report_path.exists():
        raise HTTPException(404, "no eval report yet - run: python tasks.py evals")
    return json.loads(settings.evals_report_path.read_text(encoding="utf-8"))


@app.post("/admin/reload")
def reload():
    """Re-read the semantic layer YAML (demo: add a metric, reload, ask)."""
    t0 = time.perf_counter()
    sl = semantic.reload()
    pipeline.CACHE.clear()
    return {"version": sl.version, "metrics": len(sl.metrics), "errors": sl.errors, "ms": int((time.perf_counter() - t0) * 1000)}


@app.post("/compile")
def compile_only(plan: QueryPlan):
    """Validate + compile a plan without executing (used by tests and the trace view)."""
    from .compiler import compile_plan
    from .validator import validate

    sl = semantic.get()
    v = validate(sl, plan)
    if v.errors:
        return {"ok": False, "errors": [e.as_dict() for e in v.errors]}
    q = compile_plan(sl, v.plan)
    return {"ok": True, "sql": q.display_sql, "params": q.params, "tables": q.tables}
