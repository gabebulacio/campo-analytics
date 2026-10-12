# 0003 · Summaries are templated, not generated

**Status:** accepted · 2026-10-12

**Context.** The contract requires that every number in the summary comes from the result rows.

**Decision.** `explain.py` builds the ES and EN summaries from templates (KPI, breakdown with highest and lowest, time trend, time by category, multi-dimension), formatting only result cells or sums of cells. No LLM writes summary text.

**Consequences.** Grounding is guaranteed by construction and asserted by `test_every_number_in_summary_comes_from_the_result`. Summaries cost nothing and add no latency. They are plainer than LLM prose. A later option is an LLM rewrite constrained to the same numbers, verified by the same test.
