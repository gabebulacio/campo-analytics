"""Normalisation + deterministic verified-query matching.

A verified query is a trusted, parameterised plan owned by a person. Matching
is lexical (no LLM): parameters are extracted, masked, and the masked question
is fuzzy-compared with each canonical question. High score -> VERIFIED tier.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from rapidfuzz import fuzz

from .plan import QueryPlan, plan_from_yaml
from .semantic import SemanticLayer
from .validator import latest_closed_campaign
from .values import aliases, get_values, norm

MATCH_THRESHOLD = 88
SUGGEST_THRESHOLD = 70

UNSAFE_PATTERNS = [
    r"ignor(a|á|e|ar)\b.*instruc", r"ignore (all |the |your |previous )*instructions", r"\b(drop|delete|truncate|insert|update|alter)\s+(table|from|into)\b",
    r"\bborr(a|á|ar)\b.*\b(tabla|datos|base)\b", r"(mostra|mostrá|revela|revelá|show|reveal|print).{0,20}(prompt|instrucciones|system)",
    r"system prompt", r"jailbreak", r"\bact as\b.*\b(admin|root)\b",
]
EN_HINTS = {"what", "how", "which", "show", "many", "share", "by", "the", "is", "are", "per", "of", "rate"}
ES_HINTS = {"qué", "que", "cuál", "cual", "cuántos", "cuantos", "cuántas", "por", "el", "la", "los", "las", "de", "es", "tasa", "cómo", "como", "hay"}


def detect_lang(q: str) -> str:
    words = set(re.findall(r"[a-záéíóúñ]+", q.lower()))
    es, en = len(words & ES_HINTS), len(words & EN_HINTS)
    if "¿" in q or re.search(r"[áéíóúñ]", q.lower()):
        es += 2
    return "en" if en > es else "es"


def looks_unsafe(q: str) -> bool:
    low = q.lower()
    return any(re.search(p, low) for p in UNSAFE_PATTERNS)


CAMPAIGN_RE = re.compile(r"\b(20\d{2})\s*[/-]\s*(\d{2}|20\d{2})\b")


@dataclass
class Match:
    id: str
    score: float
    plan: QueryPlan
    params: dict
    question: str
    owner: str
    verified_at: str


def _extract(sl: SemanticLayer, q: str) -> tuple[str, dict]:
    """Return (masked normalised question, params)."""
    params: dict[str, str] = {}
    text = q
    m = CAMPAIGN_RE.search(text)
    if m:
        params["campaign"] = f"{m.group(1)}/{m.group(2)[-2:]}"
        text = text[: m.start()] + " {campaign} " + text[m.end():]
    n = norm(text)
    std_alias = aliases(sl).get("standard", {})
    std_values = {norm(s): s for s in get_values().get("standard", [])}
    candidates = sorted({**std_values, **std_alias}.items(), key=lambda kv: -len(kv[0]))
    for alias, canon in candidates:
        canon = std_values.get(norm(canon), canon)
        pat = r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])"
        if re.search(pat, n):
            params.setdefault("standard", canon)
            n = re.sub(pat, " {standard} ", n, count=1)
            break
    return " ".join(n.split()), params


def _template_norm(t: str) -> str:
    return " ".join(norm(t.replace("{campaign}", " CAMPAIGNTOKEN ").replace("{standard}", " STANDARDTOKEN ")).replace("campaigntoken", "{campaign}").replace("standardtoken", "{standard}").split())


def match(sl: SemanticLayer, question: str) -> tuple[Match | None, list[Match]]:
    """Best match above threshold (or None) and near-misses for suggestions."""
    masked, params = _extract(sl, question)
    scored: list[Match] = []
    for vq in sl.verified_queries:
        best, best_q = 0.0, ""
        declared = vq.get("parameters", {}) or {}
        for lang_qs in vq["questions"].values():
            for t in lang_qs:
                tn = _template_norm(t)
                variants = [tn]
                # optional parameters (with a default) may be omitted together with their lead-in words
                for pname, pdef in declared.items():
                    if pdef.get("default") is not None and f"{{{pname}}}" in tn and pname not in params:
                        for k in range(4):
                            variants.append(" ".join(re.sub(r"(\s+\S+){%d}\s*\{%s\}" % (k, pname), "", " " + tn).split()))
                # a template without a {standard} slot can still contain a literal standard (e.g. EUDR)
                s = max([fuzz.token_sort_ratio(masked, v) for v in variants] + [fuzz.token_sort_ratio(norm(question), norm(t))])
                if s > best:
                    best, best_q = s, t
        spec = dict(vq["plan"])
        filled = {}
        for name, pdef in declared.items():
            val = params.get(name)
            if val is None:
                default = pdef.get("default")
                val = latest_closed_campaign() if default == "latest" else default
            filled[name] = val
        filters = {}
        for k, v in (spec.get("filters") or {}).items():
            if isinstance(v, str) and v.startswith("{") and v.endswith("}"):
                v = filled.get(v[1:-1])
            filters[k] = v
        spec["filters"] = filters
        # literal standard in plan (e.g. EUDR) must agree with a standard named in the question
        lit_std = (vq["plan"].get("filters") or {}).get("standard")
        if lit_std and not str(lit_std).startswith("{") and params.get("standard") and params["standard"] != lit_std:
            best -= 25
        scored.append(Match(vq["id"], best, plan_from_yaml(spec), filled, best_q, vq.get("owner", ""), str(vq.get("verified_at", ""))))
    scored.sort(key=lambda m: -m.score)
    top = scored[0] if scored and scored[0].score >= MATCH_THRESHOLD else None
    near = [m for m in scored if SUGGEST_THRESHOLD <= m.score < MATCH_THRESHOLD][:3]
    return top, near
