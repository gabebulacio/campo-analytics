# 0002 · Verified-query match runs before the LLM router

**Status:** accepted · 2026-10-12

**Context.** The pipeline contract lists route → match_verified. The router is an LLM call (cost, latency, a dependency on the API key).

**Decision.** A deterministic, lexical matcher runs first (parameter extraction + fuzzy match against canonical questions, threshold 88). On a match, the plan goes straight to validation with tier VERIFIED and no LLM call. A deterministic unsafe-pattern check runs before both. Otherwise the router and planner run as specified.

**Consequences.** The most common questions cost US$ 0 and answer in about 300 ms, and they still work if the LLM is down or unconfigured. An injection attempt cannot match a verified template, because templates are fixed text. Trade-off: the matcher is lexical, so paraphrases far from the template go to the planner, which is the correct fallback. The threshold is covered by the verified-match precision score in evals.
