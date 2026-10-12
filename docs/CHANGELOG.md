# Changelog

## 0.2.0 — 2026-10-12 · MVP polish

- **Guided 5-minute tour** on the home page: verified → governed → clarification → refusal → guardrail, each with its talking point. Every step is a golden-set case.
- **Live proof strip** under the title (governed metrics, accuracy, refusal/injection, median latency, cost per question), read from `/health` and the latest eval report.
- **Executive brief** page (`/brief`): problem, measured results, design principle, what's real vs simulated, next steps. Printable.
- **Trace fallback:** every answer is also kept in the browser, so `/trace/{id}` and `/traces` work when a serverless instance doesn't hold the trace.
- **Planner language:** clarification and refusal text now follow the question's language (English questions got Spanish refusals before).
- Suggestions collapse to six; answers scroll into view; "MVP" badge and byline.
- README rewritten for readers (live link, scorecard, tour, real vs simulated). Presenter script in `docs/DEMO.md`.
- Evals re-run: 45/45 pass, clarification appropriateness 80% → 100% (the golden set already accepted a refusal for `a01`; the old report predated that).

## 0.1.0 — 2026-10-12 · Interview cut (phases 0–4, local)

**Built**
- **Phase 0 · Scaffolding:** monorepo (`apps/web`, `services/pipeline`, `packages/schemas`, `data/`, `evals/`), `tasks.py` runner + Makefile, GitHub Actions CI (lint, tests, schema drift, evals gates, web typecheck/build, no raw hex colours), design tokens from `docs/style-guide.md`, `/health` on the pipeline.
- **Phase 1 · Data:** seeded synthetic generator matching the semantic model (14 programs, 1,800 producers, 4,678 fields as GeoJSON in real departments, 15k Crop Stories, LUC runs, compliance, alerts, forms, lots). Two raw source systems (Mongo-style documents + relational). ELT raw → staging → marts in portable SQL (DuckDB locally, Postgres on Neon). Data-quality tests: PK uniqueness, referential integrity on all 18 relationships, geometry validity, size budget, `data_origin` on every row. Planted anomalies for the result checks.
- **Phase 2 · Semantic engine:** YAML loader, `QueryPlan` (Pydantic → JSON Schema), validator (unknown metric/dimension/value with suggestions, allowed dimensions, alias + fuzzy value resolution, required filter-or-group → clarification), deterministic compiler (joins only from declared relationships, ratio-of-sums CTEs, distinct-sum for area, null-safe spine join), read-only executor (DuckDB `read_only` / Postgres `app_reader`, 5 s timeout, 5,000-row cap, sqlglot single-SELECT guard), result checks (empty, bounds, `lte_metric`, reconciliation, freshness), lineage + sample rows, semantic linter in CI.
- **Phase 3 · AI:** deterministic verified-query matcher (runs before any LLM call), router on `claude-haiku-5-5` (structured output), tool-using planner on `claude-sonnet-5-5` (`list_metrics`, `describe_metric`, `list_dimension_values`, `submit_plan`, `ask_clarification`, `refuse`), one validator repair round, one clarification round, prompt caching of the catalog, server-side refusal fallback, number-grounded templated summaries, cost and token tracking per stage. 45-case golden set with per-stage scoring, consistency runs, model comparison, CI gates.
- **Phase 4 · UI:** ask page with suggested questions per workspace, answer cards with trust badges (Verificado / Basado en métricas definidas / Sin respuesta), result-check warnings, rule-chosen charts (KPI, bar, line, grouped bars, table), "¿Cómo se calculó?" drawer (definition, filters + plan, SQL, sources lineage, sample rows), clarification chips, refusal with closest metrics, 👍/👎 feedback, pin to dashboard (JSON spec, re-run, export/import), metrics catalog, evals scorecard, traces list and stage-by-stage `/trace/{id}` replay, ES/EN toggle, light/dark/system theme.

**Semantic layer change**
- `standard_family` added to the allowed dimensions of every metric that allows `standard` (the linter flagged it as an orphan dimension; it is reachable through the same declared join).

**Known gaps**
- Phase 1b (Earth Engine reference layers) not built: fields are placed in real departments by approximate centroid and LUC flags are computed from a seeded conversion history, not from JRC/MapBiomas rasters. `data/reference/SOURCES.md` lists the planned sources.
- Geometry is stored as GeoJSON text (no PostGIS functions used yet); no map chart.
- Rate limit, cache and traces are in-process memory + JSONL files (Phase 6 moves them to Postgres).
- Dashboards are stored in the browser (localStorage); global filters and the QuickSight migration view are Phase 5.
- Exploratory free-SQL mode is not implemented (flag reserved, off).
- Planner-dependent eval cases are skipped until `ANTHROPIC_API_KEY` is set.
