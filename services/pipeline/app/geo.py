"""Centroids for geographic dimensions (map rendering only; never used in calculations).

Reuses the admin areas the generator places fields in. Phase 1b swaps this for
official boundaries.
"""

from __future__ import annotations

import importlib.util
from functools import lru_cache

from .config import settings

GEO_DIMS = {"country", "admin1", "admin2", "producer_country"}


@lru_cache(maxsize=1)
def centroids() -> dict[str, dict[str, tuple[float, float]]]:
    path = settings.root / "data" / "generator" / "geography.py"
    spec = importlib.util.spec_from_file_location("geography", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    a2, a1, c = {}, {}, {}
    for country, admin1, admin2, _biome, lat, lon in mod.ADMIN_AREAS:
        a2[admin2] = (lat, lon)
        a1.setdefault(admin1, []).append((lat, lon))
        c.setdefault(country, []).append((lat, lon))
    mean = lambda pts: (round(sum(p[0] for p in pts) / len(pts), 4), round(sum(p[1] for p in pts) / len(pts), 4))  # noqa: E731
    out = {"admin2": a2, "admin1": {k: mean(v) for k, v in a1.items()}, "country": {k: mean(v) for k, v in c.items()}}
    out["producer_country"] = out["country"]
    return out


def points(dim: str, values: list) -> dict[str, list[float]]:
    table = centroids().get(dim, {})
    return {str(v): list(table[str(v)]) for v in values if str(v) in table}
