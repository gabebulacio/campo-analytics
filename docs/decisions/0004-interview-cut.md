# 0004 · Interview cut first; Phase 1b and Phase 5–6 deferred

**Status:** accepted · 2026-10-12

**Context.** The first demo was needed the same day. README §5 defines an "interview cut".

**Decision.** Build phases 0–4 fully and locally, plus lightweight dashboards (browser-stored JSON specs). Defer Phase 1b (Earth Engine reference layers), Postgres-backed cache, rate limits and traces (Phase 6), global dashboard filters and the QuickSight migration view (Phase 5).

**Consequences.** LUC flags are computed from a seeded conversion history per field with standard-specific cutoffs, so the same field can pass EUDR and fail ISCC. In Phase 1b they will be recomputed from JRC GFC2020 and MapBiomas zonal statistics. Talking point: "the EUDR check will run against the JRC 2020 reference map."
