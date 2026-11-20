# Project Finance Checks

A shared finance team runs client projects out of the ERP and out of a spreadsheet per client. I built the platform that reads both, checks every live project and gives each role its own view. This version runs on synthetic data, so you can use it.

## The problem

The numbers already existed. They lived in two places that didn't agree.

- The ERP held budgets, time, supplier costs and billing. The client trackers held what the ERP doesn't: the revised statement of work, monthly % complete, phasing and the approvals behind them.
- Analysts refreshed each tracker by hand: run the exports, reshape them, paste them in, add missing jobs, refresh the pivots. Each workbook recomputed the same logic with its own formulas.
- Decisions lived in cell comments, where nobody else could see them.
- Problems showed up at month-end: a tracker budget that disagreed with the ERP, a live project in no tracker, time waiting more than a week for approval.

A dashboard on top would only have replaced the copy step. The trackers were a data source, an input system and an audit trail at once.

## What I built

No new data entry. It reads what the team already keeps, the same way every time.

| Step | What happens |
|---|---|
| Read | Four ERP export types and every client tracker. A file that breaks its contract is rejected and listed with the reason, never guessed |
| Compute | One row per live project, with one definition per metric. Pages only add up sums and recompute ratios from them |
| Reconcile | Time-entry fee against ERP labour actuals for every project; every break gets a cause or goes to a review list |
| Check | 11 rules. Each hit has an owner, the amount at stake and a next step |
| Show | One view per role, scoped by data: an account director sees their own projects, without unbilled amounts, rates or margin |

## Decisions

| Decision | Why | Trade-off |
|---|---|---|
| Specs before code, with a permanent ID on every rule | Finance numbers have to be traceable and testable; tests carry the requirement ID, and a gate catches requirements with no test | Slower to the first screen, and the specs can lag the build |
| Real data stays on the build machine except through a few approved, listed routes; only synthetic data goes to the cloud trial | The exports hold client financials and worker names, and a trial workspace isn't a governed tenant | The trial proves the mechanics, not real volumes or real template drift |
| Fee burn is the only burn compared with % complete | % complete is reported on fee; comparing it with fee plus supplier costs mixes units | Two burn figures exist, so both need clear labels |
| Keep the analysts' % complete as the revenue method | Changing how revenue is recognised is a Finance and audit decision, not a tooling one | Revenue is only as good as the estimate; the platform flags reversals but can't judge the estimate |
| Hold back "billed ahead of delivery" | Many hits were retainers that bill ahead by contract, and they would bury the checks people can act on | Real billing problems among them stay hidden until Finance sets a rule per contract type |
| Send fixes to the request desk the team already uses | The team already works from it, and several checks map onto request types it handles | Copy and paste, not an integration, so fix time can't be measured yet |
| Generate the Power BI report from Python instead of building it by hand | Every page can be rebuilt and diffed; editing in Desktop isn't repeatable | Desktop edits are lost unless they go back into the generator |
| No forecasts in the first phase | Simple benchmarks have to be beaten first, and I don't put a single number without a range in front of a director | Directors get no time-to-cap figure yet |

## What the synthetic version shows

The generator plants a known number of errors for each rule, then the checks run without knowing where they are. The checks page lists planted against found for every rule.
