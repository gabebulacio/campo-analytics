import type { CaseStudy, SourceRef } from "./caseStudyTypes";

/**
 * Case study of the platform this app rebuilds. Every claim carries a SourceRef: `doc` is a repo-relative file the
 * in-app reader opens (src/docs.ts lists them), `url` a public page. No real figures: the platform it describes ran
 * for an employer, and this version runs on synthetic data only.
 */

// ---- documents bundled with the app
const CASE: SourceRef = { label: "Case study draft", doc: "docs/consulting/drafts/project-finance-case.md" };
const README: SourceRef = { label: "Synthetic build README", doc: "projects/project-finance/README.md" };

// ---- public references
const ASC606: SourceRef = { label: "ASC 606 revenue recognition (FASB)", url: "https://asc.fasb.org/606/showallinonepage" };
const BULLET: SourceRef = { label: "Bullet graph specification (Perceptual Edge)", url: "https://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf" };
const WCAG: SourceRef = { label: "WCAG 2.2 contrast minimum", url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" };
const PBIR: SourceRef = { label: "Power BI enhanced report format (PBIR)", url: "https://learn.microsoft.com/power-bi/developer/projects/projects-report" };
const RLS: SourceRef = { label: "Row-level security in Power BI", url: "https://learn.microsoft.com/fabric/security/service-admin-row-level-security" };

export const CASE_STUDY: CaseStudy = {
  title: "Project Finance Checks: how it was built and why",
  subtitle:
    "A shared finance team runs client projects out of the ERP and out of a spreadsheet per client. This is the platform that reads both, checks every live project and gives each role its own view. The problem, the decisions and their trade-offs, and what is still open. This version runs on synthetic data.",
  asOf: "2026-11",
  headline: [
    { value: "11", label: "checks run on every load, each hit with an owner, the amount at stake and a next step", source: README },
    { value: "4", label: "ERP export types read next to every client tracker, each against a schema contract", source: CASE },
    { value: "1", label: "definition per metric; pages add up sums and recompute ratios from them", source: CASE },
    { value: "0", label: "real rows in this version: clients, people, projects and amounts are generated", source: README },
  ],
  sections: [
    // ------------------------------------------------------------------ 1
    {
      id: "context",
      eyebrow: "Context and problem",
      title: "The numbers already existed, in two places that didn't agree",
      summary:
        "The ERP held budgets, time, supplier costs and billing. The client trackers held what the ERP doesn't: the revised statement of work, monthly % complete, phasing and the approvals behind them.",
      blocks: [
        {
          kind: "bullets",
          items: [
            "Analysts refreshed each tracker by hand: run the exports, reshape them, paste them in, add missing jobs, refresh the pivots.",
            "Each workbook recomputed the same logic with its own formulas.",
            "Decisions lived in cell comments, where nobody else could see them.",
            "Problems showed up at month-end: a tracker budget that disagreed with the ERP, a live project in no tracker, time waiting more than a week for approval.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          title: "A dashboard on top would only have replaced the copy step",
          body: "The trackers were a data source, an input system and an audit trail at once. The platform had to read them as they are, not replace them.",
          source: CASE,
        },
      ],
    },
    // ------------------------------------------------------------------ 2
    {
      id: "built",
      eyebrow: "What was built",
      title: "No new data entry: it reads what the team already keeps, the same way every time",
      summary: "Five steps run on every load. A file that breaks its contract is rejected and listed with the reason, never guessed.",
      blocks: [
        {
          kind: "table",
          columns: ["Step", "What happens"],
          rows: [
            ["Read", "Four ERP export types and every client tracker, each checked against a schema contract"],
            ["Compute", "One row per live project, with one definition per metric. Pages only add up sums and recompute ratios from them"],
            ["Reconcile", "Time-entry fee against ERP labour actuals for every project; every break gets a cause or goes to a review list"],
            ["Check", "11 rules. Each hit has an owner, the amount at stake and a next step"],
            ["Show", "One view per role, scoped by data: an account director sees their own projects, without unbilled amounts, rates or margin"],
          ],
          source: CASE,
        },
        {
          kind: "table",
          caption: "Core metrics",
          columns: ["Metric", "Definition", "Additive"],
          rows: [
            ["Revised SOW", "Tracker revised values; the ERP budget, marked, when there is no tracker line", "Yes"],
            ["Fee actuals", "ERP labour actuals (approved) + unapproved fee from time entries", "Yes"],
            ["Committed spend", "Fee actuals + OOP actuals + open POs", "Yes"],
            ["Remaining budget", "Revised SOW − committed spend", "Yes"],
            ["Fee burn", "Fee actuals ÷ revised fee; the only burn compared with % complete", "No"],
            ["% complete", "Analyst-reported for the month-end close; rolls up weighted by revised fee", "No"],
            ["JTD / MTD revenue", "Revised fee × % complete; month-on-month change", "Yes"],
            ["Actuals not yet billed", "Fee + OOP actuals − billing to date", "Yes"],
          ],
          source: README,
        },
      ],
    },
    // ------------------------------------------------------------------ 3
    {
      id: "rules",
      eyebrow: "The checks",
      title: "11 rules, ranked by what costs money first",
      summary:
        "Critical checks are money at risk now; serious ones mean the books disagree and need a decision; warnings are housekeeping that blocks billing or close if left.",
      blocks: [
        {
          kind: "table",
          columns: ["#", "Rule", "Severity", "Fires when"],
          rows: [
            ["1", "Close to budget cap", "critical", "Fee burn ≥ 90% and % complete < 80%"],
            ["2", "Spend over revised SOW", "critical", "Committed > revised SOW"],
            ["3", "Billable time with no rate", "critical", "Billable hours at a $0 rate"],
            ["4", "In the ERP, not in a tracker", "serious", "Live project with spend and no tracker row"],
            ["5", "Revised SOW differs from ERP budget", "serious", "Differ by > $1 and > 1%, project not done"],
            ["6", "Implausible ERP budget", "serious", "> 10× the tracker SOW, or > $10M"],
            ["7", "Closed project still moving", "serious", "Closed or complete with unapproved time or open POs"],
            ["8", "Unapproved time older than 7 days", "warning", "Submitted or returned, older than 7 days at the extract date"],
            ["9", "% complete went down", "warning", "Lower than last month (a revenue reversal)"],
            ["10", "OOP billable differs from actual", "warning", "Differ by > $0.01"],
            ["11", "Billed ahead of delivery", "warning, hidden", "Billing > 105% of actuals and by > $100"],
          ],
          source: README,
        },
        {
          kind: "text",
          body: "The Glossary page shows how the checks are tested in this version: the generator plants a known number of errors for each rule, then the checks run without knowing where they are, and the table lists planted against found.",
        },
      ],
    },
    // ------------------------------------------------------------------ 4
    {
      id: "decisions",
      eyebrow: "Decisions",
      title: "Every decision with its reason and what it cost",
      summary: "The choices that shaped the platform, each with the trade-off it accepted.",
      blocks: [
        {
          kind: "decision",
          decision: "Specs before code, with a permanent ID on every rule.",
          why: "Finance numbers have to be traceable and testable; tests carry the requirement ID, and a gate catches requirements with no test.",
          tradeoff: "Slower to the first screen, and the specs can lag the build.",
          evidence: [CASE],
        },
        {
          kind: "decision",
          decision: "Real data stays on the build machine except through a few approved, listed routes; only synthetic data goes to the cloud trial.",
          why: "The exports hold client financials and worker names, and a trial workspace isn't a governed tenant.",
          tradeoff: "The trial proves the mechanics, not real volumes or real template drift.",
          evidence: [CASE],
        },
        {
          kind: "decision",
          decision: "Fee burn is the only burn compared with % complete.",
          why: "% complete is reported on fee; comparing it with fee plus supplier costs mixes units.",
          tradeoff: "Two burn figures exist, so both need clear labels.",
          evidence: [CASE, README],
        },
        {
          kind: "decision",
          decision: "Keep the analysts' % complete as the revenue method.",
          why: "Changing how revenue is recognised is a Finance and audit decision, not a tooling one.",
          tradeoff: "Revenue is only as good as the estimate; the platform flags reversals but can't judge the estimate.",
          evidence: [CASE, ASC606],
        },
        {
          kind: "decision",
          decision: "Hold back 'billed ahead of delivery'.",
          why: "Many hits were retainers that bill ahead by contract, and they would bury the checks people can act on.",
          tradeoff: "Real billing problems among them stay hidden until Finance sets a rule per contract type.",
          evidence: [CASE],
        },
        {
          kind: "decision",
          decision: "Send fixes to the request desk the team already uses.",
          why: "The team already works from it, and several checks map onto request types it handles.",
          tradeoff: "Copy and paste, not an integration, so fix time can't be measured yet.",
          evidence: [CASE],
        },
        {
          kind: "decision",
          decision: "Generate the Power BI report from Python instead of building it by hand.",
          why: "Every page can be rebuilt and diffed; editing in Desktop isn't repeatable.",
          tradeoff: "Desktop edits are lost unless they go back into the generator.",
          evidence: [CASE, PBIR],
        },
        {
          kind: "decision",
          decision: "No forecasts in the first phase.",
          why: "Simple benchmarks have to be beaten first, and a single number without a range shouldn't go in front of a director.",
          tradeoff: "Directors get no time-to-cap figure yet.",
          evidence: [CASE],
        },
      ],
    },
    // ------------------------------------------------------------------ 5
    {
      id: "views",
      eyebrow: "Views and visual rules",
      title: "One view per role, each starting where that role's work starts",
      summary: "Every view puts exceptions and headline figures on one screen, then a ranked table, then detail on demand.",
      blocks: [
        {
          kind: "table",
          columns: ["Role", "Starts on", "Question it answers"],
          rows: [
            ["Client finance analyst", "My work queue", "What do I fix this week, and for whom?"],
            ["Client finance manager", "Account position", "Where does each SOW stand: budget, spend, progress, billing?"],
            ["Director, Group Director", "Portfolio", "Where is the risk concentrated?"],
            ["Account director", "Project brief", "How much budget is left, and are we on pace?"],
            ["Finance ops", "Data health", "Is the data fresh and complete; who is unassigned?"],
          ],
        },
        {
          kind: "bullets",
          items: [
            "Budget against actual is a bullet graph: solid bar for committed spend, outlined marker for revised SOW, tick for % complete.",
            "Chart titles state the takeaway with its number, generated from the plotted data.",
            "Every chart has a table view; status is never shown by colour alone.",
            "Every headline figure and metric column has an (i) tooltip from one glossary.",
            "Every page carries a trust strip: extract date, reconciliation status and the data label.",
          ],
        },
        { kind: "sources", items: [BULLET, WCAG] },
      ],
    },
    // ------------------------------------------------------------------ 6
    {
      id: "scope",
      eyebrow: "Scope and privacy",
      title: "Here scope is a filter in the browser; the production design scopes access in the model",
      summary:
        "Choosing a viewer on the start screen stands in for signing in. Each role's pages only show its own projects, and account directors see no unbilled amounts, rates or margin.",
      blocks: [
        {
          kind: "text",
          body: "In this version the whole synthetic snapshot for a viewer is loaded and the pages filter it. The production design replaces the start-screen pick with row-level security from a role directory, so each person's sign-in sets what they can see.",
        },
        { kind: "sources", items: [RLS] },
      ],
    },
  ],
};
