# Demo script (5 minutes)

Offer the demo; don't impose it. The five questions below are the numbered starter list on the home page, in this order.

## Before the call (10 minutes)

- Open https://demo.gabrielbulacio.com/health. Check `llm_configured: true` and that `llm_spend_today_usd` is well under `daily_budget_usd`.
- Open these tabs: home (Spanish, light theme), `/case`, `/evals`, `/plan`.
- Click the five starters once to warm the cache and the serverless functions. Then reload the home page so the answer list is empty.
- Backup: `python tasks.py dev` locally, http://localhost:3000. Local requests skip the rate limit.

## Run of show

| Time | Step | Click | Say |
|---|---|---|---|
| 0:00 | Frame | Home page | "Every number comes from a defined metric. The AI chooses and combines; a deterministic compiler writes the SQL." |
| 0:30 | 1 · Verified | Starter 1, then **¿Cómo se calculó?** | "Trusted query, no LLM, under a second. Definition, filters, compiled SQL, source tables, sample rows. This is what lets an auditor follow a number." |
| 1:30 | 2 · Governed | Starter 2 | "A breakdown nobody pre-built. The planner picked the metric and the dimension; the joins are declared in the semantic layer, never chosen by the model." |
| 2:15 | 3 · Clarification | Starter 3, then pick **EUDR** | "Same field-season, several standards. Rather than guess, it asks once, and one click re-runs the question with the chosen standard." |
| 3:00 | 4 · Refusal | Starter 4 | "There's no sequestration metric, so it says so and offers the closest ones. A made-up number is worse than no answer, especially in an EUDR statement." |
| 3:30 | 5 · Guardrail | Starter 5 | "Blocked before any LLM call, and the database role is read-only anyway." |
| 3:50 | Close | `/evals` | "45 golden cases, scored per stage: routing, plan, SQL, result, clarifications, refusals, injection. CI blocks a change that lowers accuracy. About two tenths of a cent per question." |
| 4:30 | Bridge | `/plan` | "Applied to a QuickSight migration: agree the metrics first, build the layer with evals, then migrate in parallel until the numbers match." |

If there's time or they ask, also show:
- the pipeline strip under any answer (AI stages in orange, verified match in green)
- `/trace/<id>` for a stage-by-stage replay
- the `/metrics` catalog
- the YAML in `docs/semantic-layer/agri_traceability.yaml`: `emissions_intensity` (a ratio of sums), `compliance_rate` (requires a standard) and a `known_gaps` entry

## If something goes wrong

| Symptom | What to do |
|---|---|
| "Daily demo question limit reached" | Switch to the local stack, or raise `RATE_LIMIT_PER_IP_PER_DAY` on the API project |
| AI answer takes > 10 s or errors | Say "cold start", re-click; verified questions (green shield) never call the LLM |
| Spend guard message | `DAILY_BUDGET_USD` reached; switch to local |
| Trace link 404 | The trace page falls back to the copy saved in your browser; `/traces` lists both |

## Honest answers to likely questions

- **Is the data real?** Producer-level data is synthetic and seeded, placed in real departments. Land-use flags are simulated; the next step is JRC GFC2020 + MapBiomas.
- **Why not text-to-SQL?** Public benchmarks (dbt Labs, Cube) show that grounding in a semantic layer matters more than the choice of model. Free SQL exists only as a labelled exploratory mode, and it's off.
- **Routing at 97%?** One case was routed to a neighbouring workspace and still got the right result. Routing only narrows the catalog; the validator is the safety net.
- **Production?** Postgres/PostGIS and Mongo sources, auth, multi-tenant and row-level security, and a Postgres-backed cache and traces. That's the hardening phase in the plan.
