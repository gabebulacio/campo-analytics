"""Locale-aware number formatting (es-AR default, en). Used by explain + checks."""

from __future__ import annotations


def _group(n: float, decimals: int, lang: str) -> str:
    s = f"{abs(n):,.{decimals}f}"
    if lang == "es":
        s = s.replace(",", "§").replace(".", ",").replace("§", ".")
    return ("−" if n < 0 else "") + s


def number(v: float | int | None, unit: str = "", lang: str = "es") -> str:
    if v is None:
        return "–"
    if unit == "ratio":
        return _group(v * 100, 1, lang) + (" %" if lang == "es" else "%")
    if unit in ("count",):
        return _group(v, 0, lang)
    av = abs(v)
    dec = 0 if av >= 100 else (1 if av >= 10 else 2)
    s = _group(v, dec, lang)
    if unit == "USD":
        return "US$ " + s if lang == "es" else "$" + s
    suffix = {"ha": "ha", "t": "t", "tCO2e": "tCO₂e", "kgCO2e/t": "kgCO₂e/t", "hours": "h", "days": "días" if lang == "es" else "days"}.get(unit, unit)
    return f"{s} {suffix}".strip()
