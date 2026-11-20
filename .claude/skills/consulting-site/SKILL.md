---
name: consulting-site
description: Turn or extend gabrielbulacio.com as a consulting portfolio through gated phases - positioning, ghost site, copy drafts, build, multi-agent review, verify. Use when the user says "consulting site", "services page", "engagements", "case study for a client", "portfolio copy", "rewrite the home page", or adds an offer or engagement write-up.
---

# Consulting site

Layers, each ending in a gate. Don't start a layer until the previous gate passed and its line is
in `docs/consulting/gates.md` (date, command run, last line of output, who approved).

| # | Layer | Who | Output | Gate |
|---|---|---|---|---|
| 0 | Research | research subagents in parallel | `docs/consulting/research/*.md` | Sources cited; weak ones flagged |
| 1 | Positioning | **Gabriel decides**; main session proposes 2-3 options with evidence | `docs/consulting/positioning.md` (git-ignored, local only): buyer, problem, offers, proof, what is not offered | Gabriel's ruling recorded |
| 2 | Ghost site | main session | `docs/consulting/ghost-site.md`: every page's headline and section heads only | Read the headlines alone: do they tell the offer? Gabriel approves |
| 3 | Copy | main session, from `voice.md` | `docs/consulting/drafts/<page>.md` | `python scripts/site_lint.py --text <draft>` has 0 block; slop-reviewer run |
| 4 | Build | main session with the `web-ui` skill | pages in `apps/web/app/`, numbers in `apps/web/content/claims.json` | `python tasks.py sitelint` 0 block; typecheck; build |
| 5 | Review | `buyer-cfo`, `buyer-head-of-data`, `slop-reviewer`, `claims-auditor`, `web-critic` in parallel | `docs/consulting/reviews/round-N.md` | All BLOCKERs fixed or ruled out by Gabriel with a reason |
| 6 | Verify + hand over | main session | the `verify` skill's report | Gabriel tests locally; commit only after his OK; deploy only when asked |

## Rules

- **No number without a claim.** Any number on a provenance page (`provenance_pages` in
  `claims.json`) needs a claim with `source`, `verify` and `as_of`. The validator blocks the rest.
  Never add a claim to make the gate pass; add one only after finding the value in its source.
- **No employer or client figures.** Engagement write-ups describe the problem, the decision and
  what the client owned afterwards. Outcomes from client work are qualitative unless the number is
  public or from a synthetic rebuild. See the repo CLAUDE.md.
- **Don't fix the validator to pass.** A false positive gets an `allow` entry with `near` and a
  `reason`, or a rule change with a test in `scripts/tests/test_site_lint.py` that shows real
  copy passing and seeded slop still failing.
- **Reviewers merge without softening.** Copy each BLOCKER and SHOULD with its original severity
  and source agent. Drop findings without a location and evidence. Cap at one review round per
  change unless Gabriel asks for another (the private case kit agentic.md F6, F10, F18).
- **Judgment calls go to Gabriel** with the strongest evidence against the option he leans toward.
- **External figures** (market sizes, survey stats) never appear on the site as our proof.

## Commands

```
python tasks.py sitelint            # next build + validator (block findings fail)
python tasks.py sitelint --no-build --warn
python scripts/site_lint.py --text docs/consulting/drafts/home.md
python -m pytest -q scripts/tests   # the validator's own tests
```
