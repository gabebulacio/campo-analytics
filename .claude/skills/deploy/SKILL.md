---
name: deploy
description: Deploy the web app and the pipeline API to production on Vercel (gabrielbulacio.com and campo-analytics-api), with pre-flight checks and post-deploy smoke tests. Use only when the user explicitly asks to deploy, ship to production or redeploy.
disable-model-invocation: true
---

# Deploy to production

This publishes to the live site. Confirm with the user before each `vercel deploy --prod`, and only deploy from a clean, committed `main`.

Production (details in `docs/DEPLOY.md`):
| Piece | Vercel project | URL |
|---|---|---|
| Web (`apps/web`) | `campo-analytics` | https://gabrielbulacio.com (also `www.`; `demo.` only redirects) |
| API (pipeline bundle) | `campo-analytics-api` | https://campo-analytics-api-bulacio.vercel.app |

## 1. Pre-flight
- `git status` clean; `git log origin/main..main` shows what will ship.
- Run the `verify` skill. Don't deploy on a failing gate.
- If data, ELT SQL or the semantic layer changed: `python tasks.py seed`.

## 2. API (only if `services/`, `data/`, `docs/semantic-layer/` or `evals/report.json` changed)
Build the bundle **outside OneDrive / the repo**:
```
BUNDLE_DIR=~/campo-api-bundle python deploy/build_api_bundle.py      # PowerShell: $env:BUNDLE_DIR="$HOME/campo-api-bundle"; python deploy/build_api_bundle.py
cd ~/campo-api-bundle && vercel deploy --prod
```
Smoke test: `curl https://campo-analytics-api-bulacio.vercel.app/health` → `status ok`, `llm_configured: true`, expected `semantic_version` and metric count.

## 3. Web
Pushing to `main` does not deploy. Deploy by hand: `cd apps/web && vercel deploy --prod`.
Smoke test:
- `https://gabrielbulacio.com/` (personal page) and `/projects/campo-analytics` load.
- A verified question works: `/projects/campo-analytics?q=What%20share%20of%20area%20is%20EUDR%20deforestation-free%20by%20country%3F`
- `?lang=he` renders RTL.
- `curl -sI https://demo.gabrielbulacio.com/metrics` → one 308 to `https://gabrielbulacio.com/projects/campo-analytics/metrics`.

## 4. Env vars (never print values)
API: `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`, `WRITE_DIR=/tmp`, `DAILY_BUDGET_USD`, `RATE_LIMIT_PER_IP_PER_DAY`, `DEMO_MODE`. Web: `PIPELINE_URL`. Change them in the Vercel dashboard or `vercel env`, then redeploy.

## 5. Report
What deployed (commit SHA), which smoke tests passed, anything skipped.
