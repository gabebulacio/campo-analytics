# 0001 · DuckDB locally, Postgres (Neon) in production

**Status:** accepted · 2026-10-12

**Context.** The dev machine has no Docker or Postgres, and the demo must run on a laptop in minutes. Production targets Neon.

**Decision.** The ELT SQL and the compiler emit SQL valid on both engines (no dialect transpilation). Locally the marts live in `data/out/analytics.duckdb`, opened `read_only=True`. With `DATABASE_URL_READER` set, the executor switches to Postgres as `app_reader` with a read-only transaction and a 5 s statement timeout. `tasks.py elt-neon` loads the same raw files into Neon.

**Consequences.** One SQL code path, zero-setup local runs, the same read-only guarantee at the engine level in both. Geometry is GeoJSON text until PostGIS functions are needed (Phase 1b). Engine differences are caught by running CI against DuckDB and a Neon smoke test before deploy.
