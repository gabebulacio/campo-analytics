"""Locale-aware number formatting (en default, he). Used by explain + checks.

Both locales group with "," and use "." for decimals; only unit words differ.
"""

from __future__ import annotations


def _group(n: float, decimals: int, lang: str) -> str:
    s = f"{abs(n):,.{decimals}f}"
    return ("−" if n < 0 else "") + s


def number(v: float | int | None, unit: str = "", lang: str = "en") -> str:
    if v is None:
        return "–"
    if unit == "ratio":
        return _group(v * 100, 1, lang) + "%"
    if unit in ("count",):
        return _group(v, 0, lang)
    av = abs(v)
    dec = 0 if av >= 100 else (1 if av >= 10 else 2)
    s = _group(v, dec, lang)
    if unit == "USD":
        return "$" + s
    suffix = {"ha": "ha", "t": "t", "tCO2e": "tCO₂e", "kgCO2e/t": "kgCO₂e/t", "hours": "h", "days": "ימים" if lang == "he" else "days"}.get(unit, unit)
    return f"{s} {suffix}".strip()
