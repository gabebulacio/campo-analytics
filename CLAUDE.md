# CLAUDE.md

Campo Analytics and Gabriel Bulacio's personal site. `apps/web` serves **gabrielbulacio.com**: the personal page at `/` and each project under `/projects/<slug>`. Other projects live in their own repos and get a page here (see the `new-project` skill).

| Project | Code | Page |
|---|---|---|
| **Campo Analytics**: generative BI over a governed semantic layer | repo root (`services/`, `data/`, `evals/`, `docs/`) | `/projects/campo-analytics` (live demo) |
| **Worklog Lakehouse**: Microsoft Fabric medallion (Git-format items) that also runs locally | separate repo [gabebulacio/worklog-lakehouse](https://github.com/gabebulacio/worklog-lakehouse), with its own CLAUDE.md and skills | `/projects/worklog-lakehouse` (case study, `app/projects/worklog-lakehouse/`) |

## Layout

| Path | What |
|---|---|
| `apps/web/` | Next.js 15 + React 19, npm, plain CSS tokens in `app/globals.css` (no Tailwind, [ADR 0005](docs/decisions/0005-npm-plain-css-tokens.md)) |
| `apps/web/app/page.tsx` | Personal page; lists projects |
| `apps/web/app/projects/campo-analytics/` | Campo demo routes; internal links go through `demoPath()` in `lib/paths.ts` |
| `services/pipeline/app/` | FastAPI pipeline: router + planner (`llm.py`), `verified.py`, `validator.py`, `compiler.py`, `executor.py`, `checks.py`, `explain.py` |
| `docs/semantic-layer/agri_traceability.yaml` | The semantic layer: single source of truth for metrics, dimensions, joins, verified queries, known gaps |
| `data/` | Synthetic generator, ELT (raw → staging → marts), data-quality tests. `data/out/` is generated and git-ignored |
| `evals/` | Golden set (`golden/*.yaml`), runner, committed report |
| `packages/schemas/` | JSON Schemas exported from the pipeline; CI fails on drift |
| `docs/decisions/` | ADRs, numbered `NNNN-kebab-title.md` |

## Commands (Windows: always `python tasks.py …`, there is no `make`)

```
python tasks.py setup      # .venv + pip + npm
python tasks.py seed       # synthetic data + DuckDB marts + value dictionaries (needed before tests)
python tasks.py dev        # pipeline :8001 + web :3000
python tasks.py test       # pytest: services/pipeline/tests + data/tests
python tasks.py evals      # golden set → evals/report.md (+ --offline / --runs 3 / --compare)
python tasks.py schemas    # re-export packages/schemas
```
Web: `cd apps/web && npm run typecheck && npm run build`.

## Non-negotiable rules

- **The LLM picks metrics; it never writes business logic.** SQL comes only from the deterministic compiler. Don't add LLM-written SQL paths outside the feature-flagged EXPLORATORY tier.
- **Golden set ≠ prompt examples.** Never copy a golden question into `examples:` or a prompt; `test_semantic_lint.py` enforces disjointness.
- **Ratios are ratios of sums**, never averages of row ratios. Joins are declared in `relationships:`, never inferred.
- **Campo: every user-facing string exists in `en` and `he`** (UI `lib/i18n.tsx`, semantic-layer labels and verified-query phrasings). Hebrew is RTL: use logical CSS properties. Other project pages are English unless they add a language toggle.
- **Employer work stays out.** Projects and case studies inspired by past jobs are clean-room rebuilds on synthetic data: no copied code, names, emails, tenant/app IDs, client names or real figures.
- **No raw hex colours** outside `app/globals.css` (CI greps for them). Use style-guide tokens ([docs/style-guide.md](docs/style-guide.md)).
- **Producer-level data is synthetic.** Never add real company names, logos or client data. `docs/semantic-layer/portfolio/`, `docs/company-research.md` and `Prep entrevista*.md` are private: never commit or quote them.
- Never read or print `.env.local`; secrets live there and in Vercel env vars.
- Compiler snapshot changes must be deliberate (see the `pipeline` skill).

## Done means CI would pass

Run the `verify` skill before saying a change is finished. CI gates: ruff, pytest, schema drift, evals (`result_accuracy ≥ 0.95`, `refusal_correctness = 1.0`, `injection_resistance = 1.0`), web typecheck, hex grep, `next build`.

## Style

- Commit messages: one plain sentence describing the change, no `feat:` prefixes (see `git log`).
- User-visible changes get a line in [docs/CHANGELOG.md](docs/CHANGELOG.md) under a version heading `## X.Y.Z — YYYY-MM-DD · Theme`.
- Docs voice: short, plain, concrete; tables over prose.
