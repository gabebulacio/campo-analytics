const e=`# Project Finance Checks (synthetic build)\r
\r
Data layer for the \`/projects/project-finance\` dashboard on gabrielbulacio.com. It rebuilds, on made-up data, a platform I built for a professional-services finance team: per-client Excel trackers (revised SOW, monthly % complete) are read next to ERP exports, every live project gets one row of defined metrics, time entries are reconciled to ERP labour actuals, and 11 checks run on every load.\r
\r
**All data here is synthetic.** Clients, products, people, projects and amounts are generated from a fixed seed. Nothing comes from the real platform's data.\r
\r
## Run\r
\r
\`\`\`\r
python projects/project-finance/build.py            # or: python tasks.py finance\r
python -m pytest -q projects/project-finance/tests\r
\`\`\`\r
\r
Output: \`projects/project-finance/snapshot.json\`, in the shape of \`snapshot.types.ts\` next to it. \`--seed N\` and \`--out PATH\` are optional.\r
\r
The same run writes \`apps/project-finance/data/\` for the React app: \`index.json\` (15 viewers across CFA, CFM, Director, Group Director, AD and finance ops under the key \`all\`), one snapshot per viewer holding only that viewer's projects, and \`detail/<client>.json\` with every source field per project. AD files carry no billing figures; data health goes to finance ops, CFMs and CFAs only. \`--app-out DIR\` is optional.\r
\r
## What the build does\r
\r
| Step | What |\r
|---|---|\r
| Generate | 160 projects across 4 fictional clients; raw rows for the project summary, hours (Approved / Submitted / Returned), OOP lines, PO lines, 4 trackers in 2 template families, a people directory |\r
| Plant | A known number of anomalies per rule (3 to 20), each on its own project, recorded apart from the data |\r
| Load | Schema contract per file. One planted re-run of the hours export has a renamed column and is rejected with a reason |\r
| Compute | Every metric from the raw rows: fee actuals = ERP labour actuals + unapproved time; committed = fee + OOP + open POs; ratios from sums |\r
| Check | The 11 rules run on the computed projects, independently of the planting; \`planted\` in the snapshot records planted vs found |\r
\r
## The 11 rules\r
\r
| # | Rule | Severity | Fires when |\r
|---|---|---|---|\r
| 1 | Close to budget cap | critical | Fee burn ≥ 90% and % complete < 80% |\r
| 2 | Spend over revised SOW | critical | Committed > revised SOW |\r
| 3 | Billable time with no rate | critical | Billable hours at a $0 rate |\r
| 4 | In the ERP, not in a tracker | serious | Live project with spend and no tracker row |\r
| 5 | Revised SOW differs from ERP budget | serious | Differ by > $1 and > 1%, project not done |\r
| 6 | Implausible ERP budget | serious | > 10x the tracker SOW, or > $10M |\r
| 7 | Closed project still moving | serious | Closed / complete with unapproved time or open POs |\r
| 8 | Unapproved time older than 7 days | warning | Submitted or returned, older than 7 days at the extract date |\r
| 9 | % complete went down | warning | Lower than last month (a revenue reversal) |\r
| 10 | OOP billable differs from actual | warning | Differ by > $0.01 |\r
| 11 | Billed ahead of delivery | warning, hidden | Billing > 105% of actuals and by > $100 |\r
\r
Fee burn (fee actuals ÷ revised fee) is the only burn compared with % complete, because % complete is fee-based.\r
\r
## What the synthetic build leaves out\r
\r
| Real platform | Here |\r
|---|---|\r
| Real Excel trackers with variable preambles, merged headers, many template families | Two clean template families held in memory |\r
| Header detection, de-duplication of overlapping extracts, year assignment for month columns | One schema check per file |\r
| Rate cards, phasing, below-rate and behind-phasing rules | Not modelled |\r
| Exception lifecycle (first seen, acknowledged, resolved) and service-desk hand-off | Exceptions are a point-in-time list |\r
| Row-level security in the BI tool | Scope rules applied in the dashboard |\r
| Many more projects, and messier files | 160 projects |\r
`;export{e as default};
