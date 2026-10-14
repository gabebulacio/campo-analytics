---
name: pipeline
description: Change the Python answer pipeline in services/pipeline/app (router, planner, verified match, validator, compiler, executor, result checks, explain/lineage, API endpoints) safely, including compiler snapshot handling and LLM cost guards. Use when editing any file under services/pipeline, adding an endpoint, changing QueryPlan, touching prompts in llm.py, or when compiler snapshot tests fail.
---

# Pipeline changes

Flow (`pipeline.py`): guardrail (`verified.looks_unsafe`) → router (fast model) → verified-query match → planner (tool use, `llm.py`) → `validator.py` → `compiler.py` (deterministic SQL) → `executor.py` (read-only, timeout, row limit) → `checks.py` → `visualize.py` → `explain.py` (lineage + trust tier). Settings and env vars: `config.py`.

## Invariants
- The compiler is the **only** producer of SQL. It must be deterministic: same plan → byte-identical SQL.
- The executor stays read-only (DuckDB read-only connection / Postgres `app_reader`).
- Verified matches never call an LLM. Unsafe questions are blocked before any LLM call.
- Models come from `settings.model_planner` / `settings.model_fast`, never hard-coded. Keep the daily budget guard (`DAILY_BUDGET_USD`) and rate limit in the request path. Load the `claude-api` skill before changing anything in `llm.py`.
- Every user-facing message (summaries, warnings, refusals, clarifications) has `en` and `he`.

## Changing `QueryPlan` (`plan.py`)
Run `python tasks.py schemas` and commit `packages/schemas/queryplan.schema.json`; update `apps/web/lib/types.ts` to match.

## Compiler snapshots (`tests/snapshots/plan_NN_<hash>.sql`)
A snapshot is recorded the first time a plan runs and must match byte for byte after that. The filename hash is of the plan, so:
- **Plan in `tests/plans.yaml` changed** → a new snapshot file appears; delete the stale one.
- **Compiler output changed on purpose** → delete only the affected snapshot files, rerun `python tasks.py test` to re-record, then `git diff tests/snapshots` and review every SQL change before committing. Say in the commit message why the SQL changed.
- **Compiler output changed by accident** → that's the bug; fix the compiler, don't touch snapshots.
Add a new hand-written plan to `tests/plans.yaml` for any new compiler feature (the suite requires ≥ 30).

## Running it
`python tasks.py api` (pipeline alone on :8001) and `curl http://localhost:8001/health`. `POST /compile` with a plan returns the SQL without the LLM, useful for debugging. Endpoints are in `main.py`; the web app reaches them through the `/api/pipeline/*` rewrite in `apps/web/next.config.mjs`.

## Finish
`verify` skill, plus `python tasks.py evals --offline` (full evals if the planner or router changed and a key is available).
