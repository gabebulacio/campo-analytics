import type { Project, RuleId, Severity } from "./types";

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** $1,234 with a true minus sign. */
export const usd = (v: number | null | undefined): string => (v == null ? "–" : usd0.format(v).replace("-", "−"));

export const usdShort = (v: number | null | undefined): string => {
  if (v == null) return "–";
  const a = Math.abs(v), sign = v < 0 ? "−" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`;
  return `${sign}$${a.toFixed(0)}`;
};

export const pct = (v: number | null | undefined, d = 0): string => (v == null ? "–" : `${(v * 100).toFixed(d)}%`);
export const pts = (v: number | null | undefined): string => (v == null ? "–" : `${v >= 0 ? "+" : "−"}${Math.abs(v * 100).toFixed(0)} pts`);
export const n0 = (v: number) => v.toLocaleString("en-US");
export const shortName = (name: string) => name.replace(/^PRJ-\d+\s+/, "");
export const monthLabel = (m: number) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
export const dateLabel = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/** The 11 checks. `hidden` rules stay out of default views until Finance sets thresholds. */
export const RULES: Record<RuleId, { id: string; label: string; why: string; severity: Severity; next: string; amountLabel?: string; hidden?: boolean }> = {
  near_cap: { id: "R01", label: "Close to budget cap", why: "Fee burn ≥ 90% while < 80% complete", severity: "critical",
    next: "Agree re-phasing or a budget change with the account director before more time is booked", amountLabel: "fee spent" },
  over_sow: { id: "R02", label: "Spend over revised SOW", why: "Committed spend exceeds the revised SOW", severity: "critical",
    next: "Confirm an approved scope change or move time; update the SOW line", amountLabel: "over" },
  zero_rate_billable: { id: "R03", label: "Billable time with no rate", why: "Billable hours at a $0 rate", severity: "critical",
    next: "Ask the ERP admin to fix the rate on the contract line, then re-rate the entries" },
  missing_from_tracker: { id: "R04", label: "In the ERP, not in a tracker", why: "Live project with spend and no tracker row", severity: "serious",
    next: "Add the job to the tracker with its PO line and phasing, or mark it out of scope", amountLabel: "committed" },
  sow_vs_erp: { id: "R05", label: "Revised SOW ≠ ERP budget", why: "Tracker and ERP disagree by > 1%", severity: "serious",
    next: "Confirm which is right; load the approved budget in the ERP or correct the tracker", amountLabel: "gap" },
  implausible_budget: { id: "R06", label: "Implausible ERP budget", why: "> 10× the tracker SOW or > $10M on one project", severity: "serious",
    next: "Raise with the finance manager to correct the ERP budget", amountLabel: "ERP budget" },
  closed_moving: { id: "R07", label: "Closed project still moving", why: "Closed or complete with open items", severity: "serious",
    next: "Clear the unapproved time and open POs, or reopen the project", amountLabel: "open" },
  stale_unapproved: { id: "R08", label: "Unapproved time > 7 days", why: "Submitted or returned, older than a week", severity: "warning",
    next: "Chase the approver; time can't be billed until approved", amountLabel: "fee waiting" },
  pct_down: { id: "R09", label: "% complete went down", why: "Lower than last month: a revenue reversal", severity: "warning",
    next: "Record the reason before month-end sign-off", amountLabel: "revenue reversed" },
  oop_billable_mismatch: { id: "R10", label: "OOP billable ≠ actual", why: "Billable amount differs from actual cost", severity: "warning",
    next: "Review the markup or pass-through rule on the expense", amountLabel: "difference" },
  billed_ahead: { id: "R11", label: "Billed ahead of delivery", why: "Billing > actuals by > 5%; normal on some retainers", severity: "warning",
    next: "Threshold pending Finance (hidden by default)", amountLabel: "ahead", hidden: true },
};
export const RULE_ORDER: RuleId[] = ["near_cap", "over_sow", "zero_rate_billable", "missing_from_tracker", "sow_vs_erp",
  "implausible_budget", "closed_moving", "stale_unapproved", "pct_down", "oop_billable_mismatch", "billed_ahead"];
export const SEV_RANK: Record<Severity, number> = { critical: 0, serious: 1, warning: 2 };

/** Additive sums over a set of projects; ratios recomputed from sums, never averaged. */
export function totals(ps: Project[]) {
  const s = (f: (p: Project) => number | null | undefined) => ps.reduce((a, p) => a + (f(p) ?? 0), 0);
  const revised = s((p) => p.revised), committed = s((p) => p.committed);
  const pocProjects = ps.filter((p) => p.pct_complete != null && p.revised_fee > 0);
  const pocFee = pocProjects.reduce((a, p) => a + p.revised_fee, 0);
  const feeActPoc = pocProjects.reduce((a, p) => a + p.fee_actuals, 0);
  const jtd = pocProjects.reduce((a, p) => a + (p.jtd_revenue ?? 0), 0);
  return {
    n: ps.length, revised, committed, remaining: s((p) => p.remaining), feeActuals: s((p) => p.fee_actuals),
    oopActuals: s((p) => p.oop_actuals), openPo: s((p) => p.open_po), billing: s((p) => p.billing),
    unbilled: s((p) => p.unbilled), unapproved: s((p) => p.unapproved_fee), mtd: s((p) => p.mtd_revenue), jtd,
    burn: revised > 0 ? committed / revised : null,
    feeBurnPoc: pocFee > 0 ? feeActPoc / pocFee : null, pctPoc: pocFee > 0 ? jtd / pocFee : null,
    erpBudgetShare: ps.length ? ps.filter((p) => p.budget_source === "erp").length / ps.length : 0,
  };
}
