---
name: semantic-layer
description: Add or change metrics, dimensions, entities, relationships, value dictionaries, verified queries, planner examples or known gaps in docs/semantic-layer/agri_traceability.yaml, then rebuild and lint. Use when the user says "add a metric", "new KPI", "new dimension", "verified query", "trusted query", "known gap", "the planner can't answer X", or edits the semantic YAML.
---

# Semantic layer changes

File: `docs/semantic-layer/agri_traceability.yaml`. Read its header comment first: it holds the conventions. Top-level sections: `workspaces, entities, relationships, dimensions, dimension_sets, metrics, value_dictionaries, result_checks, verified_queries, examples, known_gaps, migration_map`.

## Adding a metric
Copy the shape of a neighbouring metric of the same `type`. Required fields:
```yaml
  my_metric:
    workspace: compliance            # must exist in workspaces:
    label: { en: "...", he: "..." }  # both languages, always
    description: One plain sentence.
    synonyms: [...]                  # en/he/es phrasings users actually type
    type: sum | count | count_distinct | ratio | weighted_avg | ...
    entity: <entity>                 # (ratio: numerator: / denominator: other metric names)
    expr: <entity>.<column>          # column must be declared under entities.<entity>.columns
    filters: ["<entity>.is_latest = true"]   # optional
    unit: ha | t | kgCO2e | count | ratio | usd | hours
    allowed_dimensions: [...]        # each must be reachable via declared relationships
    requires_filter_or_group: [...]  # optional, e.g. [standard]
    checks: { min: 0, max: 1 }       # where meaningful
```
Rules: ratios are ratios of sums (two metrics), never `avg(a/b)`. Never add a join to make a dimension reachable without adding it to `relationships:` — and if the path is multi-hop, prefer widening a mart (`data/elt/sql/`) over a new join chain.

## New column or entity
Add the column to the mart SQL in `data/elt/sql/`, declare it under `entities:`, then `python tasks.py seed`.

## Verified query (VERIFIED tier, answered with no LLM)
Add under `verified_queries:` with `id: vq_<snake>`, `owner`, `verified_at: <today>`, `questions: { en: [...], he: [...] }`, optional `parameters`, and a `plan`. Run the plan first (`POST /compile` or `test_compiler`) and sanity-check the numbers before marking it verified.

## Examples vs golden set
`examples:` are planner few-shots. They **must not** overlap `evals/golden/*.yaml`. Add a golden case for the new capability with the `evals` skill, never as an example.

## Known gaps
If a question is out of model scope, add a `known_gaps` entry with `topic`, `reason`, `closest: [metric, ...]` so the planner refuses helpfully.

## After any edit
```
python tasks.py elt                                          # rebuilds value dictionaries
python tasks.py test                                         # test_semantic_lint.py is the linter
python tasks.py evals --offline
```
Bump `version:` at the top for user-visible model changes and note it in `docs/CHANGELOG.md`. Then run the `verify` skill.
