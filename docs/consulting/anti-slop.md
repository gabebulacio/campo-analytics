# Anti-slop validation

Two layers. A script blocks the defects it can see; a reviewer agent answers the questions a
script can't. Neither tries to judge whether text was written by a model: detectors don't work
well enough for that, least of all on a non-native writer (research §3). Each rule names a
defect and a fix. Evidence, false positives and sources for every rule are in
[research/slop-rules.md](research/slop-rules.md).

## Layer 1: `scripts/site_lint.py` (CI, web job, after `next build`)

| Id | Checks | Severity |
|---|---|---|
| L1 | Chatbot residue ("I hope this helps", "great question") | block |
| L2 | Placeholder copy (`[Client Name]`, lorem ipsum, TODO, "coming soon") | block |
| L3 | Significance inflation ("plays a pivotal role", "a testament to") | warn; block in title, meta description, h1 |
| L4 | Strong-signal vocabulary from corpus studies (delve, showcase, meticulous, pivotal...) | warn; block at 3+ distinct on a page |
| L5 | Marketese (seamless, unlock, empower, transformative...) | warn; block in title, meta, h1 |
| L7 | Unearned superlatives (world-class, cutting-edge, state-of-the-art) | block |
| L8 | Vague quantifiers and intensifiers (numerous, significantly) | warn; block in title, meta, h1 |
| L10 | Bare "AI-powered" claims | warn; block in title, meta, h1 |
| L11 | Generic consulting phrases (actionable insights, digital transformation) | warn; block in title, meta, h1 |
| L12 | Throat-clearing openers ("in today's", "let's dive", "at its core") | block |
| L13 | Words with literal finance/stats uses (leverage, robust, comprehensive) | warn |
| T1 | "Not just X, but Y"; "isn't about X. It's about Y" | block |
| T1b | "It's not X, it's Y" | warn |
| T2 | Em dashes: 2+ in one block | block (1 = warn) |
| T4 | Participle tails (", highlighting...", ", underscoring...") | warn |
| T5 | Question headings | warn; block on h1 |
| T6 / T7 | Setup lines ("here's the thing"); recap closings ("in conclusion") | block |
| T8 | Formal transitions (moreover, furthermore) | warn |
| T9 | Title Case headings of 4+ content words | warn |
| T11 | Emoji in copy or source | block |
| T14 | Sentence-final exclamation marks (not `!=`) | warn |
| C01 | A number on a provenance page with no claim in `apps/web/content/claims.json` | block |
| C02 | A claim that no longer appears on its page | warn |
| M01-M07 | `lang`, `<title>`, meta description, og:image (warn), one h1, heading jumps (warn), `img` alt | block unless noted |
| D1 | create-next-app leftovers | block |
| D2-D4, D10 | Gradients, gradient text, glass blur or glow, decorative motion | warn (`/* slop-ok: reason */` on the line to accept) |

The site's current pages: 0 block, 22 warn (16 missing og:images, 3 client-rendered pages with no
server h1, 3 question headings that name what the Worklog gold layer answers, which are fine).

**Changing a rule.** A false positive gets an `allow` entry in `claims.json` (`phrase`, `near`,
`reason`) or a rule change with a test in `scripts/tests/test_site_lint.py` that shows real copy
passing and seeded slop still failing. Never loosen a rule to get a page through the gate.

## Layer 2: `slop-reviewer` agent (before copy is called final)

Pass/fail questions R1 to R15 in [research/slop-rules.md §2](research/slop-rules.md). The ones that
matter most for a consulting site:

| Id | Question |
|---|---|
| R1 | Swap test: put a competitor's name on the page. Would any sentence stop being true? |
| R2 | Does every service name a deliverable, a typical situation or a past engagement? |
| R3 | From the first screen, can a CFO tell who this is, what he builds, for whom, and see one proof? |
| R4 | Does every outcome number say how it was measured and carry its denominator? |
| R5 | Is every testimonial and logo real and approved? (FTC rule on fake reviews, in force since Oct 2024) |
| R6 | Does each case study show a decision, a rejected option, a limit and how it was checked? |
| R14 | Spanish false friends fixed by hand, not by an LLM "polish" pass, which brings L3 to L5 back |

The `buyer-cfo`, `buyer-head-of-data`, `claims-auditor` and `web-critic` agents cover the rest of
the review (see the `consulting-site` skill).
