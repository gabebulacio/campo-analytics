---
name: run-app
description: Launch this repo locally (pipeline API on :8001, Next.js web on :3000), seed data if needed, and confirm it works in the browser or via curl. Use when asked to run, start, serve, preview or screenshot the app, or to see a change working end to end.
---

# Run locally

## First time / after data changes
```
python tasks.py setup     # only if .venv or apps/web/node_modules is missing
python tasks.py seed      # only if data/out/analytics.duckdb is missing, or generator / ELT / semantic layer changed
```

## Start
Run each as a **background** process so the session isn't blocked:
```
python tasks.py api       # pipeline  http://localhost:8001  (uvicorn --reload)
python tasks.py web       # web       http://localhost:3000
```
(`python tasks.py dev` starts both in one process without reload.) The web app proxies `/api/pipeline/*` to `PIPELINE_URL`, default `http://127.0.0.1:8001`.

## Confirm
```
curl http://localhost:8001/health                      # engine, llm_configured, semantic_version, metrics
curl -X POST http://localhost:8001/ask -H "Content-Type: application/json" -d '{"question":"What share of area is EUDR deforestation-free by country?","lang":"en"}'
```
Pages: `/` (personal page), `/projects/campo-analytics` (ask), `/dashboards`, `/metrics`, `/evals`, `/traces`, `/case`, `/architecture`, `/plan` under the same prefix. Add `?lang=he` for Hebrew and `?q=<question>` to ask on load.

Verified questions (green shield) work without an API key. Free-form questions need `ANTHROPIC_API_KEY` in `.env.local` (don't open that file; ask the user to set it) and a pipeline restart; `/health` shows `llm_configured: true`.

## Troubleshooting
- Port busy: another server is already running. Reuse it or stop it; check `data/out/*.log`.
- Tests or API say the database is missing: `python tasks.py seed`.
- Stop the background processes when done unless the user wants them left running.
