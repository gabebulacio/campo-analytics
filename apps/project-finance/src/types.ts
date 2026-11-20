/** Snapshot schema of the synthetic files in ../data. */
export interface Project {
  id: string;
  name: string;
  client: string;
  client_name: string;
  product: string;
  portfolio: string;
  status: string;
  contract: string;
  start: string | null;
  end: string | null;
  ad: string | null;
  cfa: string | null;
  cfm: string | null;
  pm: string | null;
  tracker: string | null;
  family: string | null;
  budget_source: "tracker" | "erp";
  revised: number;
  revised_fee: number;
  wd_budget: number;
  fee_actuals: number;
  oop_actuals: number;
  open_po: number;
  committed: number;
  remaining: number;
  burn: number | null;
  fee_burn: number | null;
  pct_complete: number | null;
  pct_prev: number | null;
  jtd_revenue: number | null;
  mtd_revenue: number | null;
  billing?: number;
  unbilled?: number;
  unapproved_fee: number;
  fee_by_month_2026: number[];
}

export type RuleId =
  | "near_cap" | "zero_rate_billable" | "over_sow" | "stale_unapproved" | "missing_from_tracker"
  | "oop_billable_mismatch" | "sow_vs_erp" | "implausible_budget" | "pct_down" | "closed_moving" | "billed_ahead";

export interface ExceptionRow {
  rule: RuleId;
  project_id: string;
  client: string;
  cfa: string | null;
  cfm: string | null;
  owner: string | null;
  owner_role: "CFA" | "CFM";
  amount: number;
  reference: string;
  detail: string;
}

export interface Health {
  as_of: string;
  poc_month: string;
  sources: { report: string; file?: string; status: string; rows: number; live?: number }[];
  trackers: { file: string; family: string; rows: number }[];
  parse: { tracker_rows: number; revised_parsed: number; pct_parsed: number };
  reconciliation: { check: string; expected: number; actual: number; of: number; causes: Record<string, number>; status: string; note: string }[];
  role_gaps: Record<string, number | null>;
}

export interface Viewer { key: string; file: string; name: string; role: string; projects: number; clients: string[] }

/** One file in the (synthetic) source extract. */
export interface CatalogEntry {
  id: string;
  path: string;
  portfolio: string;
  folder: string;
  name: string;
  kind: string;
  ext: string;
  bytes: number;
  as_of: string | null;
  status: string;
  rows: number;
  projects: number;
  clients: string[];
  sheets: string[];
  tabs_read: string[];
}

export interface SourceLines { columns: string[]; rows: (string | number | null)[][]; total: number; file?: string | null }

/** Every field the source files hold for one project, loaded on demand from data/detail/. */
export interface ProjectDetail {
  summary: { file: string; fields: [string, string, string | number][] };
  tracker: { file: string; tab: string; fields: [string, string, string | number][] } | null;
  po: SourceLines;
  oop: SourceLines;
  hours: SourceLines;
}

export interface Snapshot {
  meta: { exportedAt: string; asOf: string; pocMonth: string; scope: string; viewer: { key: string; name: string; role: string } };
  projects: Project[];
  exceptions: ExceptionRow[];
  health: Health | null;
  catalog?: CatalogEntry[];
  /** Per rule: anomalies the generator planted and the checks found. */
  planted?: Partial<Record<RuleId, { planted: number; found: number }>>;
}

export type Severity = "critical" | "serious" | "warning";
export type ViewId = "queue" | "account" | "portfolio" | "brief" | "health" | "library" | "requests" | "glossary" | "pitch" | "case";
