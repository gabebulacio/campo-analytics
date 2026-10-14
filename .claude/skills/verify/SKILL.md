---
name: verify
description: Run the same checks CI runs (ruff, pytest, schema drift, evals gates, web typecheck, hex-colour grep, next build) locally before calling a change done, committing or opening a PR. Use when the user says "check", "verify", "run CI", "is this ready", "before I commit", or after finishing any code change.
---

# Verify (local CI)

Mirror `.github/workflows/ci.yml`. Run only the jobs the change touches, but run **all** of them before a commit or PR. `python tasks.py` uses `.venv` when it exists and the current Python otherwise; call ruff with the same interpreter (`.venv/Scripts/python.exe` if present, else `python`).

## 0. Data present?
Tests skip when `data/out/analytics.duckdb` is missing. If it's missing, or the generator / ELT SQL / semantic layer changed, run `python tasks.py seed` first.

## 1. Pipeline job (any change under `services/`, `data/`, `evals/`, `docs/semantic-layer/`)
```
python -m ruff check services/pipeline data evals --select E,F,I --ignore E501
python tasks.py test
python tasks.py schemas && git diff --exit-code packages/schemas
python tasks.py evals --offline        # no API key needed; full `python tasks.py evals` if ANTHROPIC_API_KEY is set
```
- If ruff isn't installed: `python -m pip install -r services/pipeline/requirements.txt` (it's listed there).
- Schema diff non-empty → the change altered `QueryPlan`; commit the regenerated `packages/schemas/` deliberately.
- Evals: read the `gates:` line. Any `FAIL` blocks the merge. Don't commit `evals/report.*` from an `--offline` run over a full-run report unless the user asks.

## 2. Web job (any change under `apps/web/`)
```
cd apps/web
npm run typecheck
grep -rnE '#[0-9A-Fa-f]{6}' app components lib --include=*.tsx --include=*.ts | grep -v globals.css   # must print nothing
npm run build
```

## 3. Report
State exactly what ran and what passed. Paste failing output. Never say "CI will pass" for a job you skipped; say it was skipped and why.
