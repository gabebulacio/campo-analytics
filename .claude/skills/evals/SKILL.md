---
name: evals
description: Run, extend and interpret the golden-set evals (evals/run.py) that score routing, verified match, plan, result, refusal, clarification and injection resistance separately, with CI gates. Use when the user mentions evals, golden set, accuracy, regression, "did this break answers", model comparison, latency/cost per question, or adds a new capability that needs a test case.
---

# Evals

## Run
```
python tasks.py evals                 # all cases; LLM cases are SKIPPED without ANTHROPIC_API_KEY
python tasks.py evals --offline       # verified + deterministic injection cases only, free
python tasks.py evals --runs 3        # consistency: same plan across runs
python tasks.py evals --compare       # planner model comparison
```
Output: `evals/report.md` + `evals/report.json`. Exit code 1 if a gate fails. Gates (in `evals/run.py`, `GATES`): `result_accuracy ≥ 0.95`, `refusal_correctness = 1.0`, `injection_resistance = 1.0`. Never lower a threshold to make a run pass; that needs an ADR and an explicit user decision.

A full run costs real money (~US$0.003/question × 45). Ask before `--runs N` or `--compare`.

## Add a case
Append to `evals/golden/core.yaml` (or a new `evals/golden/<topic>.yaml`; all files are loaded). Next free id in its group: `v` verified, `g` governed, `a` ambiguous (clarification), `o` out-of-scope, `i` injection.
```yaml
- id: g15
  question: "..."                      # write it like a real user; mix en and he across cases
  workspace: compliance
  tags: [breakdown, ratio]             # include `injection` for injection cases
  expect: { status: answered, tier: GOVERNED,
            plan: { metrics: [...], dimensions: [...], filters: { ... } } }
```
`status`: `answered | clarification | not_answered`. Answered cases are scored on **result equality** against `expect.plan` (order-insensitive), so the plan must validate and compile; check with `python tasks.py test`.

Never reuse a golden question as a planner example or in a prompt (`test_semantic_lint.py` enforces this).

## Interpret a failure
Open the case in `evals/report.md`: compare `routed_workspace`, `verified_id`, `got_status` and the plan against `expect`. Fix the stage that diverged (router → `llm.py`, verified match → `verified.py` / question phrasings, plan → semantic-layer synonyms/descriptions, result → compiler/marts). Prefer fixing the semantic layer over prompt edits.

## Report numbers
When the README's eval table or the case-study page quotes scores, update them from the new `report.md`, not by hand.
