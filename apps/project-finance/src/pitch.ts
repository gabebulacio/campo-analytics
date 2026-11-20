/**
 * The pitch deck, written once and rendered twice: as slides on the "About this platform" page and as a
 * PowerPoint download (pitchDeck.ts). Anonymised: no figures from the real engagement, no client or employer
 * names. The only numbers are facts of the design (rules, roles, formats).
 */

export interface Stat { value: string; label: string }
/** One box of a flow chart: a short glyph, then what happens there. */
export interface ChainStep { glyph: string; tag: string; title: string; text: string; detail?: string[] }
export type Slide =
  | { kind: "title"; eyebrow: string; title: string; lede: string; stats: Stat[] }
  | { kind: "stats"; eyebrow: string; title: string; lede: string; stats: Stat[]; note?: string }
  | { kind: "flow"; eyebrow: string; title: string; lede: string; columns: { n: string; head: string; items: { title: string; text: string }[] }[]; note?: string }
  | { kind: "cards"; eyebrow: string; title: string; lede: string; cards: { title: string; text: string; tag: string }[] }
  | { kind: "chain"; eyebrow: string; title: string; lede: string; steps: ChainStep[]; note?: string }
  | { kind: "rows"; eyebrow: string; title: string; lede: string; rows: { label: string; value: string; text: string; tone?: "critical" | "serious" | "warning" }[]; note?: string }
  | { kind: "steps"; eyebrow: string; title: string; lede: string; steps: { when: string; title: string; text: string; done?: boolean }[] }
  | { kind: "close"; eyebrow: string; title: string; lede: string; asks: { title: string; text: string }[]; stats: Stat[] };

export const PITCH_TITLE = "Project Finance Checks";

export const SLIDES: Slide[] = [
  {
    kind: "title",
    eyebrow: "Project Finance Checks · synthetic data",
    title: "Every SOW, its spend and what needs fixing, in one place",
    lede: "Finance teams keep a tracker per client by hand to answer questions the ERP already holds the data for. This platform reads the same ERP exports and trackers, reconciles them, and gives each role its own view, with the fixes routed to the request desk and every page downloadable.",
    stats: [
      { value: "11", label: "checks run on every load" },
      { value: "6", label: "roles, each starting on its own view" },
      { value: "4", label: "ERP export types read next to the trackers" },
      { value: "4", label: "download formats on every page" },
    ],
  },
  {
    kind: "flow",
    eyebrow: "01  Today",
    title: "The numbers exist, but they live in one workbook per client",
    lede: "Analysts export ERP reports, paste them into a client tracker and reconcile by hand. Each client family has its own layout, and managers and directors ask the analysts instead of looking it up.",
    columns: [
      { n: "01", head: "Copy", items: [
        { title: "Run the exports", text: "Project summary, hours, OOP and PO lines" },
        { title: "Reshape and paste", text: "Into each client's tracker, every week" },
      ] },
      { n: "02", head: "Recompute", items: [
        { title: "Same logic, many formulas", text: "Each workbook works out burn and revenue its own way" },
        { title: "Decisions in comments", text: "Cell comments nobody else can see" },
      ] },
      { n: "03", head: "Find out late", items: [
        { title: "At month-end", text: "A budget that disagrees with the ERP, a job in no tracker" },
        { title: "By asking", text: "Questions go to the analysts as reporting requests" },
      ] },
    ],
  },
  {
    kind: "flow",
    eyebrow: "02  How it works",
    title: "Same inputs the team already has, read the same way every time",
    lede: "No new data entry. The platform reads the exports and trackers where they already sit, checks them against each other, and publishes one model that every page, CTA and download reads from.",
    columns: [
      { n: "01", head: "The sources", items: [
        { title: "ERP exports", text: "Project summary, hours, OOP and PO lines" },
        { title: "Client trackers", text: "Revised SOW, % complete, phasing, comments" },
        { title: "Role directory", text: "Who is analyst, manager, account director, director per client" },
      ] },
      { n: "02", head: "The flow", items: [
        { title: "Read and validate", text: "Schema check per file; rejected files are listed, never guessed" },
        { title: "Reconcile", text: "Time entries vs ERP actuals; each break gets a cause" },
        { title: "Check", text: "11 rules flag budget caps, missing rates, stale time, gaps" },
      ] },
      { n: "03", head: "The output", items: [
        { title: "A view per role", text: "Work queue, account position, portfolio, project brief, data health" },
        { title: "Every field, traceable", text: "Each number names its file and tab" },
        { title: "Downloads", text: "Excel, CSV, PowerPoint or PDF, filtered as the page is" },
      ] },
    ],
  },
  {
    kind: "cards",
    eyebrow: "03  Who it's for",
    title: "One model, six audiences, each starting where their work starts",
    lede: "A view is built for one audience's decisions and cadence. Everyone sees only their own clients and projects.",
    cards: [
      { title: "Client finance analyst", tag: "My work queue", text: "What to fix this week, most urgent first, with the request that fixes it." },
      { title: "Client finance manager", tag: "Account position", text: "Where each SOW stands: budget, spend, progress, billing." },
      { title: "Directors", tag: "Portfolio", text: "Where the money is and where the risk is concentrated." },
      { title: "Account directors and PMs", tag: "Project brief", text: "Budget left and pace, without rates or margin." },
      { title: "Finance ops", tag: "Data health", text: "Is the data fresh, complete and reconciled; who is unassigned." },
      { title: "Everyone", tag: "Library and glossary", text: "Where every report and file lives, and what every figure means." },
    ],
  },
  {
    kind: "rows",
    eyebrow: "04  What it finds",
    title: "11 rules, ranked by what costs money first",
    lede: "Rules run on every load and generate CTAs. Each names an owner (the analyst, or the manager when there's none), says what to do next, and opens the request that fixes it, filled in.",
    rows: [
      { label: "Critical", value: "3", tone: "critical", text: "Close to the budget cap, spend over the revised SOW, billable time at a $0 rate" },
      { label: "Serious", value: "4", tone: "serious", text: "In the ERP but missing from the tracker, SOW and ERP budget disagree, implausible budget, closed projects still moving" },
      { label: "Warning", value: "4", tone: "warning", text: "Time unapproved for more than a week, % complete went down, OOP billable differs from actual, billed ahead (held back)" },
    ],
    note: "Values are the number of rules per severity. Thresholds are placeholders until Finance confirms them; \"billed ahead\" is held back until there's a rule per contract type.",
  },
  {
    kind: "cards",
    eyebrow: "05  Trust",
    title: "Every number can be traced back to the file it came from",
    lede: "The platform shows its own data quality on every page: the extract date, what reconciled and what didn't, and which files it could and couldn't read.",
    cards: [
      { title: "Schema contracts", tag: "Read", text: "A file missing an expected column is rejected with the reason and listed." },
      { title: "Reconciliation", tag: "Check", text: "Time-entry fee against ERP labour actuals; each break gets a likely cause." },
      { title: "Source fields", tag: "Trace", text: "A project brief shows every field from its source files, by file and tab." },
      { title: "One glossary", tag: "Define", text: "Every figure has an (i) with what it means and how it's worked out." },
      { title: "Ratios from sums", tag: "Compute", text: "Pages add up sums and recompute ratios, so totals always agree." },
      { title: "Planted errors", tag: "Test", text: "The synthetic version plants errors per rule and checks that each is found." },
    ],
  },
  {
    kind: "chain",
    eyebrow: "06  From finding to fixing",
    title: "Each CTA carries the right request for the desk",
    lede: "The team already runs on a request desk. The platform doesn't replace it: it sends better-formed requests there, with the project and the evidence copied in, and answers the reporting questions that don't need a request at all.",
    steps: [
      { glyph: "!", tag: "Found", title: "A check fires", text: "Project, amount and detail identified" },
      { glyph: "→", tag: "Routed", title: "Owner and next step", text: "The analyst, or the manager when there's none" },
      { glyph: "⧉", tag: "Request", title: "Request text copied", text: "Type, project, check and amount, nothing retyped" },
      { glyph: "OK", tag: "Fixed", title: "Next load", text: "The CTA clears when the data does" },
    ],
  },
  {
    kind: "chain",
    eyebrow: "07  How a download works",
    title: "One click: a page as Excel, CSV, PowerPoint or PDF",
    lede: "Each page describes itself once as headline figures and tables, and every format renders that same description, so the files never disagree with the screen.",
    steps: [
      { glyph: "▤", tag: "Page", title: "Headline figures and tables", text: "Filtered exactly as shown", detail: ["Excel", "CSV", "PowerPoint", "PDF"] },
      { glyph: "{ }", tag: "Build", title: "In the browser", text: "Workbook, deck or CSV built on the spot; nothing is sent anywhere" },
      { glyph: "↓", tag: "Save", title: "The file", text: "Every row in Excel, with an About sheet and the definitions" },
    ],
  },
  {
    kind: "flow",
    eyebrow: "08  Next step",
    title: "A data layer, so CTAs and reports refresh once or twice a day",
    lede: "The proposed next phase moves the same reads, reconciliation and rules into scheduled pipelines, so the model, every CTA and every download stay fresh with no one in the loop.",
    columns: [
      { n: "01", head: "Ingest", items: [
        { title: "ERP on a schedule", text: "The export types pulled by an integration user" },
        { title: "Trackers where they sit", text: "Read on change; an input store replaces copy-paste" },
      ] },
      { n: "02", head: "Engineer", items: [
        { title: "Quality gates", text: "A bad load is held back; the last good one stays live" },
        { title: "Rules as tested code", text: "Each CTA keeps its history across loads" },
      ] },
      { n: "03", head: "Serve", items: [
        { title: "Refresh after each load", text: "The model updates right after the pipeline" },
        { title: "Scope by sign-in", text: "Row-level security from the role directory replaces the start-screen pick" },
      ] },
    ],
  },
  {
    kind: "close",
    eyebrow: "What it would need",
    title: "Three decisions to take it further",
    lede: "The rules, views and downloads work. To refresh them for every client without anyone running a build:",
    asks: [
      { title: "Scheduled access to the ERP", text: "An integration user for the export types, instead of manual downloads" },
      { title: "A home for the data layer", text: "Capacity and a workspace for the pipelines and the certified model" },
      { title: "Owners for rules and roles", text: "Finance signs off the thresholds; finance ops keeps the role directory" },
    ],
    stats: [
      { value: "1", label: "model instead of one tracker per client" },
      { value: "11", label: "checks with an owner and a next step" },
      { value: "6", label: "roles with their own start page" },
    ],
  },
];
