# Deploy

## Current production (all on Vercel, no card needed)

| Piece | Where |
|---|---|
| Web (`apps/web`) | Vercel project `campo-analytics` → https://campo-analytics.vercel.app, `gabrielbulacio.com`, `demo.` and `www.` |
| API (pipeline) | Vercel project `campo-analytics-api` (FastAPI zero-config, Python 3.12) → https://campo-analytics-api-bulacio.vercel.app |

Redeploy:
```
python tasks.py seed                                                       # if data or semantic layer changed
BUNDLE_DIR=~/campo-api-bundle python deploy/build_api_bundle.py           # keep the bundle outside OneDrive
cd ~/campo-api-bundle && vercel deploy --prod
cd apps/web && vercel deploy --prod
```
API env vars (Vercel → campo-analytics-api → Settings → Environment Variables): `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`, `WRITE_DIR=/tmp`, `DAILY_BUDGET_USD`, `RATE_LIMIT_PER_IP_PER_DAY`, `DEMO_MODE`.
Web env var: `PIPELINE_URL` = the API URL. DNS: records added in Cloudflare via Domain Connect (DNS only).

The Cloud Run path below remains the target for the Postgres/Mongo architecture.

---

Target: **https://demo.gabrielbulacio.com**

```
Browser ──> Vercel (apps/web, Next.js) ──/api/pipeline/*──> Cloud Run (pipeline, FastAPI) ──> DuckDB marts inside the image
                                                                    └──> Anthropic API (router + planner)
```

The pipeline image builds its own synthetic data and marts at build time (seeded, ~10 s). The first deploy therefore needs no Neon or Atlas. Those come in step 6.

Time: about 30–40 minutes the first time. Cost: US$ 0 at demo traffic, plus Anthropic usage.

---

## 1. Push the repo to GitHub (once)
```
git remote add origin https://github.com/gabebulacio/ai-analytics-demo.git
git push -u origin main
```
GitHub Actions runs CI on every push: lint, tests, schema drift, evals, web build.
Optional: add `ANTHROPIC_API_KEY` under repo **Settings → Secrets → Actions** so CI also scores the planner cases. Without it they are skipped.

## 2. Google Cloud: deploy the pipeline to Cloud Run
Install the gcloud CLI: https://cloud.google.com/sdk/docs/install. Then run, from the repo root:

```
gcloud auth login
gcloud config set project <your-project-id>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# the Anthropic key lives in Secret Manager, never in the image
printf "%s" "sk-ant-..." | gcloud secrets create anthropic-api-key --data-file=-
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud run deploy pipeline --source . --region southamerica-east1 \
  --allow-unauthenticated --min-instances 0 --max-instances 2 --memory 1Gi --cpu 1 --timeout 60 \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest \
  --set-env-vars "DEMO_MODE=true,RATE_LIMIT_PER_IP_PER_DAY=30,CORS_ORIGINS=https://demo.gabrielbulacio.com"
```
`--source .` builds the root `Dockerfile` with Cloud Build. `.gcloudignore` keeps the upload small and excludes `.env*` and personal files.
The command prints a URL like `https://pipeline-xxxxx-rj.a.run.app`. Check it:
```
curl https://pipeline-xxxxx-rj.a.run.app/health      # expect "llm_configured": true
```
Set a **budget alert at US$ 5**: Billing → Budgets & alerts.

## 3. Vercel: deploy the web app
1. https://vercel.com/new → import `gabebulacio/ai-analytics-demo`.
2. Set **Root Directory** to `apps/web`. The framework (Next.js) is detected automatically.
3. Add the environment variable `PIPELINE_URL` = the Cloud Run URL from step 2, without a trailing slash.
4. Deploy. You get `https://ai-analytics-demo-xxx.vercel.app`. Open it and ask a verified question.

## 4. Domain: demo.gabrielbulacio.com
1. In Vercel, go to Project → Settings → Domains and add `demo.gabrielbulacio.com`.
2. In Cloudflare, go to DNS for `gabrielbulacio.com` and add a `CNAME` record with name `demo`, target `cname.vercel-dns.com`, and proxy status **DNS only** (grey cloud).
3. Wait a few minutes for Vercel to issue the certificate.

## 5. Guardrails before you share the link
- Anthropic Console → Limits: set a monthly spend limit (e.g. US$ 20). This is the hard cap.
- The pipeline rate-limits per client IP (`RATE_LIMIT_PER_IP_PER_DAY`), caches repeated questions, and answers verified questions without any LLM call.
- `max-instances 2` caps Cloud Run concurrency cost.

## 6. Later (optional): Neon Postgres + MongoDB Atlas
This moves the marts to the architecture's real database and the raw documents to Mongo.
1. In the Neon SQL editor:
   ```sql
   create extension if not exists postgis;
   create role app_owner login password '<strong-1>';
   create role app_reader login password '<strong-2>';
   grant create on database neondb to app_owner;
   alter role app_reader set default_transaction_read_only = on;
   ```
2. Put `DATABASE_URL_OWNER`, `DATABASE_URL_READER` and `MONGODB_URI` in `.env.local`, then run:
   ```
   python tasks.py seed
   python tasks.py elt-neon                 # raw -> staging -> marts in Neon, grants SELECT to app_reader
   python data/loaders/load_mongo.py        # raw document collections to Atlas
   ```
3. Add the reader URL as a secret and redeploy. The executor switches to Postgres automatically:
   ```
   printf "%s" "postgres://app_reader:...?sslmode=require" | gcloud secrets create database-url-reader --data-file=-
   gcloud run services update pipeline --region southamerica-east1 \
     --update-secrets DATABASE_URL_READER=database-url-reader:latest
   ```
   `/health` then reports `"engine": "postgres"`.

## Redeploying
- Web: every push to `main` redeploys on Vercel automatically.
- Pipeline: rerun the `gcloud run deploy pipeline --source . ...` command, or `gcloud run services update` for config-only changes.
