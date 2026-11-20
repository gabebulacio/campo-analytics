// Data contract between the synthetic build (projects/project-finance/build.py) and the dashboard.
// build.py writes data/snapshot.json in exactly this shape; every value is synthetic.
// Money is USD, rounded to cents. Ratios are 0..1 (fee_burn may exceed 1). Dates are ISO yyyy-mm-dd.

export type Role = "analyst" | "manager" | "director" | "account" | "ops";

export type RuleId =
  | "near_cap" //          1 critical: fee_burn >= 0.90 and pct_complete < 0.80
  | "over_sow" //          2 critical: committed > revised
  | "zero_rate" //         3 critical: billable hours at a 0 rate
  | "missing_tracker" //   4 serious: live project with spend and no tracker row
  | "sow_vs_erp" //        5 serious: tracker revised SOW and ERP budget differ by > $1 and > 1%, project not done
  | "implausible_budget" //6 serious: ERP budget > 10x tracker SOW, or > $10M
  | "closed_moving" //     7 serious: closed / complete with unapproved time or open POs
  | "stale_unapproved" //  8 warning: time submitted or returned, older than 7 days at as_of
  | "pct_down" //          9 warning: % complete lower than last month
  | "oop_mismatch" //     10 warning: OOP billable and actual differ by > $0.01
  | "billed_ahead"; //    11 warning, hidden: billing > 105% of actuals and by > $100

export type Severity = "critical" | "serious" | "warning";

export interface Rule {
  id: RuleId;
  n: number; // 1..11, display order
  label: string; // "Close to budget cap"
  severity: Severity;
  fires_when: string; // plain-language condition, matches the comment above
  next_step: string;
  hidden: boolean; // billed_ahead only: computed, not shown until Finance sets a rule
}

export interface Project {
  id: string; // "PRJ-0001"
  name: string; // fictional
  client: string; // fictional client name, e.g. "Northwind Health"
  product: string; // fictional brand / product line
  status: "Active" | "On Hold" | "Complete" | "Closed";
  start: string;
  end: string;
  analyst: string | null; // viewer key of the finance analyst, null = unassigned
  manager: string | null;
  account: string | null; // account director
  in_tracker: boolean;
  budget_source: "tracker" | "erp"; // where `revised` came from
  revised: number; // revised SOW: tracker revised total, else ERP budget
  revised_fee: number;
  erp_budget: number;
  fee_actuals: number; // approved + unapproved time
  oop_actuals: number;
  open_po: number;
  committed: number; // fee_actuals + oop_actuals + open_po
  remaining: number; // revised - committed
  burn: number | null; // committed / revised
  fee_burn: number | null; // fee_actuals / revised_fee; the only burn compared with pct_complete
  pct_complete: number | null; // analyst-reported, for poc_month
  pct_prev: number | null;
  billing: number;
  unbilled: number; // fee_actuals + oop_actuals - billing (hidden from the account role)
  unapproved_fee: number;
  fee_by_month: number[]; // 12 months of the year, index 0 = January
}

export interface Exception {
  rule: RuleId;
  project_id: string;
  owner: string | null; // viewer key: the analyst, else the manager
  amount: number; // money at stake for this hit
  detail: string; // one line: what fired, with the numbers
}

export interface Viewer {
  key: string; // "a-lena"
  name: string; // fictional
  role: Role;
  clients: string[]; // for director / ops: all clients they see
}

export interface Source {
  name: string; // "Project summary export", "Hours export", "OOP export", "PO lines export", "Tracker: <client>"
  kind: "erp" | "tracker" | "directory";
  status: "accepted" | "rejected";
  rows: number;
  reason?: string; // why rejected, e.g. "missing column 'Fee Amount'" (one planted schema-drift file)
}

export interface Snapshot {
  meta: {
    generated_at: string; // ISO timestamp of the build
    seed: number;
    as_of: string; // extract date
    poc_month: string; // "2026-09"
    year: number;
  };
  rules: Rule[];
  viewers: Viewer[];
  projects: Project[];
  exceptions: Exception[]; // includes hidden-rule hits; the UI filters by Rule.hidden
  health: {
    sources: Source[];
    parse: { tracker_rows: number; revised_parsed: number; pct_parsed: number };
    reconciliation: { projects: number; matched: number; explained: number; for_review: number }; // time entries vs ERP labour actuals
    unassigned: { analyst: number; manager: number; account: number };
  };
  // Test evidence the case study cites: hits per rule vs anomalies planted by the generator.
  planted: Record<RuleId, { planted: number; found: number }>;
}

// Scope: analyst / manager / account see projects where they are named; director and ops see all
// projects of their clients. The account role never sees unbilled, billing or rates.
