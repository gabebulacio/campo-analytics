---
name: adr
description: Record an architecture decision in docs/decisions/ and, for user-visible changes, a docs/CHANGELOG.md entry, in this repo's format. Use when the user says "ADR", "record this decision", "why did we choose", "document the tradeoff", "update the changelog", "release notes", or when a change picks a new tool, database, deploy target, model or eval threshold.
---

# Decisions and changelog

## ADR
Next number = highest in `docs/decisions/` + 1, four digits. File: `docs/decisions/NNNN-kebab-title.md`. Projects in their own repos keep their own ADRs. Format (match `0005-npm-plain-css-tokens.md`):

```markdown
# NNNN · Short decision title

**Status:** accepted · YYYY-MM-DD

**Context.** What forced the decision, in two or three sentences. Include the constraint (time, cost, platform).

**Decision.** What we do, stated plainly.

**Consequences.** What gets easier, what gets harder, and what would make us revisit it.
```
Superseding: set the old one to `**Status:** superseded by NNNN · date` and link it. Keep ADRs short; link the README or the code instead of repeating them. Link new ADRs from the README's "Further reading" when they explain a visible design choice.

## Changelog
`docs/CHANGELOG.md`, newest first:
```markdown
## X.Y.Z — YYYY-MM-DD · Theme in a few words

- One bullet per user-visible change: what changed and why it matters, in plain words. Name files or flags in backticks when someone would look for them.
```
Minor bump for features, patch for fixes. Several commits on the same day can share one entry. Use today's real date.
