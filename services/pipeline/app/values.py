"""Value dictionaries: distinct values of low-cardinality dimensions.

Refreshed after ELT (python tasks.py elt). The validator uses them to check
filter values and the planner sees them so it never invents a value.
"""

from __future__ import annotations

import json
import unicodedata
from functools import lru_cache

from rapidfuzz import fuzz, process

from .config import settings
from .executor import execute
from .semantic import SemanticLayer, get


def norm(s: str) -> str:
    # strip accents and punctuation outside ASCII, but keep Hebrew letters (U+05D0-U+05EA)
    s = "".join(c for c in unicodedata.normalize("NFKD", str(s)) if c.isascii() or "א" <= c <= "ת")
    return " ".join(s.lower().replace("_", " ").replace("-", " ").split())


def build(sl: SemanticLayer | None = None) -> dict:
    sl = sl or get()
    out: dict[str, list[str]] = {}
    for dname in sl.value_dictionaries.get("dimensions", []):
        d = sl.dimensions[dname]
        (ent,) = tuple(d.entities)
        table = sl.entities[ent].table
        q = f"select distinct {d.expr} as v from {table} as {ent} where {d.expr} is not null order by 1"
        res = execute(q, [])
        out[dname] = [str(r[0]) for r in res.rows]
    payload = {"semantic_version": sl.version, "engine": settings.engine, "values": out}
    settings.value_dict_path.parent.mkdir(parents=True, exist_ok=True)
    settings.value_dict_path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    get_values.cache_clear()
    return payload


@lru_cache(maxsize=1)
def get_values() -> dict[str, list[str]]:
    if not settings.value_dict_path.exists():
        return build()["values"]
    return json.loads(settings.value_dict_path.read_text(encoding="utf-8"))["values"]


def aliases(sl: SemanticLayer) -> dict[str, dict[str, str]]:
    """{dimension: {normalised alias: canonical value}}"""
    out: dict[str, dict[str, str]] = {}
    for dim, table in (sl.value_dictionaries.get("aliases") or {}).items():
        m = out.setdefault(dim, {})
        for canonical, alist in table.items():
            m[norm(canonical)] = canonical
            for a in alist:
                m[norm(a)] = canonical
    return out


def resolve(sl: SemanticLayer, dimension: str, value: str) -> tuple[str | None, list[str], bool]:
    """Map a user/planner value to a canonical one.

    Returns (canonical or None, suggestions, was_fuzzy).
    """
    known = get_values().get(dimension)
    if known is None:  # not dictionary-backed (high cardinality or time)
        return value, [], False
    n = norm(value)
    by_norm = {norm(k): k for k in known}
    if n in by_norm:
        return by_norm[n], [], False
    al = aliases(sl).get(dimension, {})
    if n in al and al[n] in known:
        return al[n], [], False
    match = process.extractOne(n, list(by_norm), scorer=fuzz.WRatio)
    if match and match[1] >= 92:
        return by_norm[match[0]], [], True
    sugg = [by_norm[m[0]] for m in process.extract(n, list(by_norm), scorer=fuzz.WRatio, limit=3) if m[1] >= 60]
    return None, sugg, False
