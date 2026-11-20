import type { ExceptionRow, Project, RuleId } from "./types";
import { RULES, shortName, usd } from "./format";

/**
 * The request desk: where people ask the shared-services team for a fix. In the real platform each CTA opened the
 * matching request form with the project details filled in. Here the desk is generic: the button copies the
 * request text, ready to paste into whatever desk a team uses.
 */
/** volume180 is SYNTHETIC: a made-up 180-day count so the page shows where demand sits. Not the real desk's figures. */
export interface RequestType { id: string; name: string; theme: string; what: string; volume180: number }

export const REQUEST_TYPES: RequestType[] = [
  { id: "edit-project", name: "Edit an existing project", theme: "Projects and budgets", what: "Change a project's budget, dates, owners or setup in the ERP.", volume180: 640 },
  { id: "budget-approval", name: "Budget and project approval", theme: "Projects and budgets", what: "Approve a new budget or a budget change.", volume180: 12 },
  { id: "clean-up", name: "Clean up projects", theme: "Projects and budgets", what: "Close or tidy projects that are finished but still have open items.", volume180: 88 },
  { id: "closure", name: "Project closure", theme: "Projects and budgets", what: "Close a single project.", volume180: 9 },
  { id: "resource-plan", name: "Resource plan", theme: "Projects and budgets", what: "Set up or change the resource plan on a project.", volume180: 310 },
  { id: "billable-project", name: "Billable project (opportunity required)", theme: "Projects and budgets", what: "Create a billable project from an opportunity.", volume180: 170 },
  { id: "non-billable-project", name: "Non-billable project", theme: "Projects and budgets", what: "Create a non-billable project.", volume180: 41 },
  { id: "opportunity", name: "Opportunity and estimate", theme: "Projects and budgets", what: "Set up an opportunity and its estimate.", volume180: 220 },
  { id: "estimate-validation", name: "Estimate validation", theme: "Projects and budgets", what: "Validate an estimate before it becomes a budget.", volume180: 48 },
  { id: "billing", name: "Billing support", theme: "Billing", what: "Invoices, billing amounts, OOP markups and pass-through questions.", volume180: 470 },
  { id: "billing-schedule", name: "Billing schedule", theme: "Billing", what: "Create or change a billing schedule.", volume180: 75 },
  { id: "rebill", name: "Rebill", theme: "Billing", what: "Reissue an invoice.", volume180: 22 },
  { id: "cost-transfer", name: "Cost transfer", theme: "Billing", what: "Move costs between projects.", volume180: 95 },
  { id: "time", name: "Time move or time entry", theme: "Time", what: "Move time between projects or fix time entries, including unapproved time.", volume180: 350 },
  { id: "contract-rate", name: "Contract and rate sheet", theme: "Contracts and rates", what: "Fix a contract line or a rate, for example billable time at a $0 rate.", volume180: 260 },
  { id: "amend-contract", name: "Amend a contract or rate", theme: "Contracts and rates", what: "Change an existing contract or rate sheet, with an effective date.", volume180: 18 },
  { id: "revenue", name: "Revenue recognition", theme: "Revenue", what: "Questions on % complete and revenue, including a % complete that went down.", volume180: 30 },
  { id: "tracker", name: "Client tracker support", theme: "Trackers and reporting", what: "Add a job to a client tracker or fix a tracker.", volume180: 14 },
  { id: "reporting", name: "Reporting", theme: "Trackers and reporting", what: "Ask for a report. Many of these are what this platform answers self-serve.", volume180: 205 },
  { id: "purchase-order", name: "Purchase order", theme: "Purchasing", what: "Raise or change a purchase order.", volume180: 70 },
  { id: "intercompany-po", name: "Intercompany purchase order", theme: "Purchasing", what: "Purchase orders between group companies.", volume180: 24 },
  { id: "supplier-invoice", name: "Supplier invoice", theme: "Purchasing", what: "Supplier invoice questions.", volume180: 6 },
  { id: "access", name: "Access to the request desk", theme: "Other", what: "Ask for access to the desk or its reports.", volume180: 40 },
  { id: "other", name: "Other", theme: "Other", what: "Anything that doesn't fit another type.", volume180: 66 },
];

const byId = new Map(REQUEST_TYPES.map((r) => [r.id, r]));
export const requestType = (id: string) => byId.get(id)!;

/** Which request fixes each check. The first one is the default button. */
export const RULE_REQUESTS: Record<RuleId, string[]> = {
  near_cap: ["edit-project", "budget-approval"],
  over_sow: ["edit-project", "budget-approval"],
  zero_rate_billable: ["contract-rate", "amend-contract"],
  missing_from_tracker: ["tracker"],
  sow_vs_erp: ["edit-project"],
  implausible_budget: ["edit-project"],
  closed_moving: ["clean-up", "closure"],
  stale_unapproved: ["time"],
  pct_down: ["revenue"],
  oop_billable_mismatch: ["billing"],
  billed_ahead: ["billing"],
};

/** The request text, so the desk gets the facts without retyping. */
export function requestText(o: { type: string; check: string; project: string; projectId: string; client: string; detail: string; amount?: string; next: string }) {
  return [
    `Request type: ${o.type}`,
    `Project: ${o.projectId} ${o.project}`,
    `Client: ${o.client}`,
    `Check: ${o.check}${o.amount ? ` (${o.amount})` : ""}`,
    `Detail: ${o.detail}`,
    `Asked for: ${o.next}`,
    "Raised from Project Finance Checks (synthetic data).",
  ].join("\n");
}

export function exceptionText(typeId: string, e: ExceptionRow, p: Project | undefined) {
  const meta = RULES[e.rule];
  return requestText({ type: requestType(typeId).name, check: meta.label, project: p ? shortName(p.name) : "", projectId: e.project_id,
    client: p?.client_name ?? e.client, detail: e.detail, amount: e.amount ? usd(e.amount) : undefined, next: meta.next });
}
