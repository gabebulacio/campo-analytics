import type { Bundle, Col, Sheet } from "./export";
import type { CatalogEntry, ExceptionRow, Health, Project, ProjectDetail, RuleId } from "./types";
import type { Planted } from "./planted";
import { RULES, RULE_ORDER, SEV_RANK, n0, pct, shortName, totals, usdShort } from "./format";
import { GLOSSARY } from "./glossary";
import { REQUEST_TYPES, RULE_REQUESTS, exceptionText, requestType } from "./requests";
import { CASE_STUDY } from "./caseStudy";
import type { Block, SourceRef } from "./caseStudyTypes";

/** Each page's downloadable content (see export.ts). Columns carry raw numbers; formats are applied per file type. */

export const visible = (ex: ExceptionRow[]) => ex.filter((e) => !RULES[e.rule]?.hidden);
export const feeAhead = (p: Project) => (p.pct_complete != null && p.fee_burn != null ? (p.fee_burn - p.pct_complete) * p.revised_fee : null);

const projectCols: Col<Project>[] = [
  { label: "Project ID", get: (p) => p.id, width: 15 },
  { label: "Project", get: (p) => shortName(p.name), width: 48 },
  { label: "Client", get: (p) => p.client_name },
  { label: "Product", get: (p) => p.product },
  { label: "Portfolio", get: (p) => p.portfolio },
  { label: "Status", get: (p) => p.status },
  { label: "Start", get: (p) => p.start, fmt: "date" },
  { label: "End", get: (p) => p.end, fmt: "date" },
  { label: "AD", get: (p) => p.ad },
  { label: "PM", get: (p) => p.pm },
  { label: "CFA", get: (p) => p.cfa },
  { label: "CFM", get: (p) => p.cfm },
  { label: "Budget source", get: (p) => (p.budget_source === "erp" ? "ERP (no tracker line)" : "Tracker") },
  { label: "Tracker", get: (p) => p.tracker, width: 40 },
  { label: "Revised SOW", get: (p) => p.revised, fmt: "usd" },
  { label: "Revised fee", get: (p) => p.revised_fee, fmt: "usd" },
  { label: "ERP budget", get: (p) => p.wd_budget, fmt: "usd" },
  { label: "Fee actuals", get: (p) => p.fee_actuals, fmt: "usd" },
  { label: "Awaiting approval", get: (p) => p.unapproved_fee, fmt: "usd" },
  { label: "OOP actuals", get: (p) => p.oop_actuals, fmt: "usd" },
  { label: "Open POs", get: (p) => p.open_po, fmt: "usd" },
  { label: "Committed", get: (p) => p.committed, fmt: "usd" },
  { label: "Remaining", get: (p) => p.remaining, fmt: "usd" },
  { label: "Spend burn", get: (p) => p.burn, fmt: "pct" },
  { label: "Fee burn", get: (p) => p.fee_burn, fmt: "pct" },
  { label: "% complete", get: (p) => p.pct_complete, fmt: "pct" },
  { label: "% complete last month", get: (p) => p.pct_prev, fmt: "pct" },
  { label: "Fee ahead of delivery", get: (p) => feeAhead(p), fmt: "usd" },
  { label: "JTD revenue", get: (p) => p.jtd_revenue, fmt: "usd" },
  { label: "MTD revenue", get: (p) => p.mtd_revenue, fmt: "usd" },
  { label: "Billed to date", get: (p) => p.billing, fmt: "usd" },
  { label: "Not yet billed", get: (p) => p.unbilled, fmt: "usd" },
  ...["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => ({
    label: `Fee booked ${m} 2026`, get: (p: Project) => p.fee_by_month_2026?.[i] ?? null, fmt: "usd" as const })),
];

function exceptionSheet(ex: ExceptionRow[], projects: Project[]): Sheet<ExceptionRow> {
  const pm = new Map(projects.map((p) => [p.id, p]));
  const rows = [...ex].sort((a, b) => SEV_RANK[RULES[a.rule].severity] - SEV_RANK[RULES[b.rule].severity] || b.amount - a.amount);
  return {
    name: "CTAs", title: "Open CTAs, most severe first",
    rows,
    columns: [
      { label: "Severity", get: (e) => RULES[e.rule].severity },
      { label: "Call to action", get: (e) => RULES[e.rule].label, width: 30 },
      { label: "Rule", get: (e) => RULES[e.rule].id, width: 10 },
      { label: "Project ID", get: (e) => e.project_id, width: 15 },
      { label: "Project", get: (e) => shortName(pm.get(e.project_id)?.name ?? ""), width: 44 },
      { label: "Client", get: (e) => pm.get(e.project_id)?.client_name ?? e.client },
      { label: "Amount", get: (e) => e.amount || null, fmt: "usd" },
      { label: "Detail", get: (e) => e.detail, width: 44 },
      { label: "Next action", get: (e) => RULES[e.rule].next, width: 60 },
      { label: "Owner", get: (e) => e.owner ?? "unassigned" },
      { label: "Owner role", get: (e) => e.owner_role },
      { label: "Request type", get: (e) => requestType(RULE_REQUESTS[e.rule][0]).name, width: 34 },
      { label: "Request text", get: (e) => exceptionText(RULE_REQUESTS[e.rule][0], e, pm.get(e.project_id)), width: 60 },
    ],
  };
}

function ruleSummary(ex: ExceptionRow[]) {
  return RULE_ORDER.filter((r) => !RULES[r].hidden).map((r) => {
    const rows = ex.filter((e) => e.rule === r);
    return { r, n: rows.length, amount: rows.reduce((a, e) => a + e.amount, 0) };
  }).filter((x) => x.n > 0);
}

export function queueBundle(projects: Project[], exceptions: ExceptionRow[]): Bundle {
  const ex = visible(exceptions);
  const crit = ex.filter((e) => RULES[e.rule].severity === "critical");
  return {
    title: "My work queue",
    subtitle: ex.length ? `${n0(ex.length)} items to clear; ${n0(crit.length)} critical carrying ${usdShort(crit.reduce((a, e) => a + e.amount, 0))}` : "Nothing to clear",
    kpis: [
      { label: "Items to clear", value: n0(ex.length) },
      { label: "Critical", value: n0(crit.length), foot: usdShort(crit.reduce((a, e) => a + e.amount, 0)) },
      { label: "Serious", value: n0(ex.filter((e) => RULES[e.rule].severity === "serious").length) },
      { label: "Warnings", value: n0(ex.filter((e) => RULES[e.rule].severity === "warning").length) },
    ],
    sheets: [
      exceptionSheet(ex, projects),
      { name: "By CTA", rows: ruleSummary(ex), columns: [
        { label: "Call to action", get: (x) => RULES[x.r as keyof typeof RULES].label, width: 32 },
        { label: "Severity", get: (x) => RULES[x.r as keyof typeof RULES].severity },
        { label: "Rule", get: (x) => RULES[x.r as keyof typeof RULES].why, width: 50 },
        { label: "Items", get: (x) => x.n, fmt: "int" },
        { label: "Amount", get: (x) => x.amount, fmt: "usd" },
      ] } as Sheet<{ r: string; n: number; amount: number }>,
    ],
    notes: ["Thresholds are placeholders until Finance confirms them. 'Billed ahead' is hidden pending a rule per contract type."],
  };
}

export function accountBundle(projects: Project[], exceptions: ExceptionRow[]): Bundle {
  const t = totals(projects);
  const rows = [...projects].sort((a, b) => (feeAhead(b) ?? -Infinity) - (feeAhead(a) ?? -Infinity));
  return {
    title: "Account position",
    subtitle: `${n0(t.n)} projects · revised SOW ${usdShort(t.revised)} · committed ${usdShort(t.committed)} · remaining ${usdShort(t.remaining)}`,
    kpis: [
      { label: "Revised SOW", value: usdShort(t.revised), foot: `${n0(t.n)} projects` },
      { label: "Committed spend", value: usdShort(t.committed) },
      { label: "Remaining", value: usdShort(t.remaining) },
      { label: "Fee burn vs complete", value: `${pct(t.feeBurnPoc)} / ${pct(t.pctPoc)}` },
    ],
    sheets: [{ name: "Projects", title: "Projects, most fee spent ahead of delivery first", columns: projectCols, rows }, exceptionSheet(visible(exceptions), projects)],
  };
}

export interface GroupRow { c: string; ct: ReturnType<typeof totals>; risk: number; crit: number }
export function portfolioGroups(projects: Project[], exceptions: ExceptionRow[]) {
  const riskIds = new Set(exceptions.filter((e) => e.rule === "near_cap" || e.rule === "over_sow").map((e) => e.project_id));
  const byClient = new Set(projects.map((p) => p.client_name)).size > 1;
  const groupOf = (p: Project) => (byClient ? p.client_name : p.product);
  const critBy = new Map<string, number>();
  visible(exceptions).forEach((e) => { if (RULES[e.rule].severity === "critical") critBy.set(e.project_id, (critBy.get(e.project_id) ?? 0) + 1); });
  const groups: GroupRow[] = [...new Set(projects.map(groupOf))].map((c) => {
    const ps = projects.filter((p) => groupOf(p) === c);
    return { c, ct: totals(ps), risk: ps.filter((p) => riskIds.has(p.id)).reduce((a, p) => a + p.committed, 0),
      crit: ps.reduce((a, p) => a + (critBy.get(p.id) ?? 0), 0) };
  }).sort((a, b) => b.risk - a.risk || b.ct.revised - a.ct.revised);
  return { groups, byClient, groupWord: byClient ? "client" : "product", riskIds };
}

export function portfolioBundle(projects: Project[], exceptions: ExceptionRow[]): Bundle {
  const t = totals(projects);
  const { groups, groupWord, riskIds } = portfolioGroups(projects, exceptions);
  const atRisk = projects.filter((p) => riskIds.has(p.id)).reduce((a, p) => a + p.committed, 0);
  return {
    title: "Portfolio overview",
    subtitle: `${n0(t.n)} live projects across ${groups.length} ${groupWord}s · ${usdShort(atRisk)} committed on projects near or over their cap`,
    kpis: [
      { label: "Revised SOW", value: usdShort(t.revised) },
      { label: "Committed spend", value: usdShort(t.committed), foot: `Spend burn ${pct(t.burn)}` },
      { label: "Remaining", value: usdShort(t.remaining) },
      { label: "$ at risk", value: usdShort(atRisk) },
    ],
    sheets: [
      { name: groupWord === "client" ? "By client" : "By product", rows: groups, columns: [
        { label: groupWord === "client" ? "Client" : "Product", get: (g) => g.c, width: 30 },
        { label: "Projects", get: (g) => g.ct.n, fmt: "int" },
        { label: "Revised SOW", get: (g) => g.ct.revised, fmt: "usd" },
        { label: "Committed", get: (g) => g.ct.committed, fmt: "usd" },
        { label: "Remaining", get: (g) => g.ct.remaining, fmt: "usd" },
        { label: "Spend burn", get: (g) => g.ct.burn, fmt: "pct" },
        { label: "$ at risk", get: (g) => g.risk, fmt: "usd" },
        { label: "Critical CTAs", get: (g) => g.crit, fmt: "int" },
      ] } as Sheet<GroupRow>,
      { name: "Projects", columns: projectCols, rows: projects },
    ],
  };
}

export function briefBundle(p: Project, exceptions: ExceptionRow[], d: ProjectDetail | null): Bundle {
  const ex = visible(exceptions).filter((e) => e.project_id === p.id);
  const sheets: Sheet[] = [
    { name: "Project", title: shortName(p.name), rows: projectCols.map((c) => ({ k: c.label, v: c.get(p), fmt: c.fmt })),
      columns: [{ label: "Field", get: (r: any) => r.k, width: 30 }, { label: "Value", get: (r: any) => r.v, width: 60 }] },
    exceptionSheet(ex, [p]),
  ];
  if (d) {
    sheets.push({ name: "ERP project summary", title: `ERP project summary (${d.summary.file})`, rows: d.summary.fields,
      columns: [{ label: "Group", get: (r: any) => r[0] }, { label: "Field", get: (r: any) => r[1], width: 36 }, { label: "Value", get: (r: any) => r[2], width: 50 }] });
    if (d.tracker) sheets.push({ name: "Tracker row", title: `${d.tracker.file} · ${d.tracker.tab}`, rows: d.tracker.fields,
      columns: [{ label: "Group", get: (r: any) => r[0], width: 34 }, { label: "Column", get: (r: any) => r[1], width: 44 }, { label: "Value", get: (r: any) => r[2], width: 60 }] });
    for (const [key, name] of [["hours", "Hours by role level"], ["po", "PO lines"], ["oop", "OOP lines"]] as const) {
      const L = d[key];
      if (L.rows.length) sheets.push({ name, rows: L.rows, columns: L.columns.map((c, i) => ({ label: c, get: (r: any) => r[i] })) });
    }
  }
  return {
    title: `Project brief ${p.id}`,
    subtitle: `${shortName(p.name)} · ${p.client_name} · ${p.product}`,
    kpis: [
      { label: "Revised SOW", value: usdShort(p.revised) },
      { label: "Committed", value: usdShort(p.committed) },
      { label: "Remaining", value: usdShort(p.remaining) },
      { label: "Fee burn / % complete", value: `${pct(p.fee_burn)} / ${pct(p.pct_complete)}` },
    ],
    sheets,
  };
}

export function healthBundle(h: Health, projects: Project[]): Bundle {
  const rec = h.reconciliation[0];
  return {
    title: "Data health",
    subtitle: `Extract as of ${h.as_of} · POC month ${h.poc_month}`,
    kpis: [
      { label: "Sources accepted", value: `${h.sources.filter((s) => s.status === "accepted").length} / ${h.sources.length}` },
      { label: "Reconciliation breaks", value: rec ? `${rec.actual} / ${rec.of}` : "–", foot: rec ? `${rec.causes.unexplained ?? 0} need review` : undefined },
      { label: "Tracker parse", value: pct(h.parse.revised_parsed, 1) },
      { label: "Projects without a CFA", value: n0(projects.filter((p) => !p.cfa).length) },
    ],
    sheets: [
      { name: "Sources", rows: h.sources, columns: [{ label: "Report", get: (s: any) => s.report }, { label: "File", get: (s: any) => s.file ?? "all summary files", width: 80 },
        { label: "Status", get: (s: any) => s.status, width: 30 }, { label: "Rows", get: (s: any) => s.rows, fmt: "int" }] },
      { name: "Trackers", rows: h.trackers, columns: [{ label: "Tracker", get: (t: any) => t.file, width: 70 }, { label: "Family", get: (t: any) => t.family },
        { label: "Job rows", get: (t: any) => t.rows, fmt: "int" }] },
      { name: "Reconciliation", rows: h.reconciliation, columns: [{ label: "Check", get: (r: any) => r.check, width: 60 }, { label: "Breaks", get: (r: any) => r.actual, fmt: "int" },
        { label: "Of", get: (r: any) => r.of, fmt: "int" }, { label: "Causes", get: (r: any) => Object.entries(r.causes).map(([k, v]) => `${v} ${k}`).join("; "), width: 80 },
        { label: "Note", get: (r: any) => r.note, width: 80 }] },
    ],
  };
}

export function libraryBundle(catalog: CatalogEntry[]): Bundle {
  return {
    title: "Report library",
    subtitle: `${n0(catalog.length)} source files · ${n0(catalog.filter((c) => c.status === "read").length)} read by the platform`,
    sheets: [{ name: "Source files", rows: catalog, columns: [
      { label: "Portfolio", get: (c: CatalogEntry) => c.portfolio, width: 10 },
      { label: "Folder", get: (c: CatalogEntry) => c.folder, width: 50 },
      { label: "File", get: (c: CatalogEntry) => c.name, width: 60 },
      { label: "Kind", get: (c: CatalogEntry) => c.kind, width: 26 },
      { label: "As of", get: (c: CatalogEntry) => c.as_of },
      { label: "Clients", get: (c: CatalogEntry) => c.clients.join(", "), width: 30 },
      { label: "Status", get: (c: CatalogEntry) => c.status, width: 40 },
      { label: "Rows read", get: (c: CatalogEntry) => c.rows, fmt: "int" },
      { label: "Projects", get: (c: CatalogEntry) => c.projects, fmt: "int" },
      { label: "Tabs", get: (c: CatalogEntry) => c.sheets.join(" | "), width: 60 },
      { label: "Size (KB)", get: (c: CatalogEntry) => Math.round(c.bytes / 1024), fmt: "int" },
    ] }],
  };
}

export function requestsBundle(): Bundle {
  return {
    title: "Raise a request",
    subtitle: "Request desk request types and the checks they fix",
    sheets: [{ name: "Request types", rows: REQUEST_TYPES, columns: [
      { label: "Request type", get: (r: any) => r.name, width: 40 }, { label: "Theme", get: (r: any) => r.theme, width: 24 },
      { label: "What it's for", get: (r: any) => r.what, width: 70 },
      { label: "Fixes these checks", get: (r: any) => Object.entries(RULE_REQUESTS).filter(([, ids]) => ids.includes(r.id)).map(([k]) => RULES[k as keyof typeof RULES].label).join("; "), width: 60 },
    ] }],
  };
}

export function glossaryBundle(planted?: Planted): Bundle {
  const tested = RULE_ORDER.filter((r) => planted?.[r]).map((r) => ({ r, ...planted![r]! }));
  const sheets: Sheet[] = [{ name: "Terms", rows: Object.values(GLOSSARY), columns: [
    { label: "Term", get: (t: any) => t.label, width: 28 }, { label: "Group", get: (t: any) => t.group, width: 20 },
    { label: "What it means", get: (t: any) => t.what, width: 80 }, { label: "How it's worked out", get: (t: any) => t.how ?? "", width: 60 },
    { label: "Source", get: (t: any) => t.source ?? "", width: 50 }] }];
  if (tested.length) sheets.push({ name: "How the checks are tested", title: "Planted vs found per rule (synthetic data)", rows: tested, columns: [
    { label: "Rule", get: (x: any) => RULES[x.r as RuleId].label, width: 34 }, { label: "Severity", get: (x: any) => RULES[x.r as RuleId].severity },
    { label: "Planted", get: (x: any) => x.planted, fmt: "int" }, { label: "Found", get: (x: any) => x.found, fmt: "int" }] });
  return { title: "Glossary", sheets };
}

export function caseBundle(): Bundle {
  const decisions = CASE_STUDY.sections.flatMap((s) => s.blocks.filter((b) => b.kind === "decision").map((b) => ({ section: s.eyebrow, ...(b as Extract<Block, { kind: "decision" }>) })));
  const refs = new Map<string, SourceRef>();
  const add = (r?: SourceRef) => { if (r) refs.set(r.doc ?? r.url ?? r.label, r); };
  CASE_STUDY.headline.forEach((h) => add(h.source));
  CASE_STUDY.sections.forEach((s) => s.blocks.forEach((b) => {
    if (b.kind === "decision") b.evidence.forEach(add);
    else if (b.kind === "sources") b.items.forEach(add);
    else if (b.kind === "stats") b.stats.forEach((x) => add(x.source));
    else if (b.kind === "table" || b.kind === "callout") add(b.source);
  }));
  return {
    title: "Case study", subtitle: CASE_STUDY.title,
    kpis: CASE_STUDY.headline.slice(0, 4).map((h) => ({ label: h.label, value: h.value })),
    sheets: [
      { name: "Sections", rows: CASE_STUDY.sections, columns: [{ label: "Section", get: (s: any) => s.eyebrow, width: 28 },
        { label: "Finding", get: (s: any) => s.title, width: 70 }, { label: "Summary", get: (s: any) => s.summary, width: 100 }] },
      { name: "Decisions", rows: decisions, columns: [{ label: "Section", get: (d: any) => d.section, width: 24 }, { label: "Decision", get: (d: any) => d.decision, width: 60 },
        { label: "Why", get: (d: any) => d.why, width: 90 }, { label: "Alternatives considered", get: (d: any) => (d.alternatives ?? []).join("; "), width: 70 },
        { label: "Trade-off", get: (d: any) => d.tradeoff ?? "", width: 60 }, { label: "Evidence", get: (d: any) => d.evidence.map((e: SourceRef) => e.doc ?? e.url ?? e.label).join("; "), width: 70 }] },
      { name: "Sources", rows: [...refs.values()], columns: [{ label: "Source", get: (r: any) => r.label, width: 50 },
        { label: "Document", get: (r: any) => r.doc ?? "", width: 60 }, { label: "Link", get: (r: any) => r.url ?? "", width: 70 }] },
    ],
  };
}
