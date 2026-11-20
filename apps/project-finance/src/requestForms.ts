import type { ExceptionRow, Project } from "./types";

/**
 * Mock of the request desk's forms. In the real platform each CTA opened the desk's form for the matching request
 * type with the project details filled in. Here the same forms are mocked: the fields, which ones are required, and
 * which ones the platform fills follow the real forms; labels are generic and nothing is sent anywhere.
 * Fields the data can't answer reliably (customer account, business unit, quantity, attachments) are left for the
 * requester, as they were in the real platform.
 */
export type FieldKind = "text" | "textarea" | "select" | "number" | "date" | "file";

export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  hint?: string;
}

export interface Prefill { [fieldId: string]: string }

const SUPPORT_AREAS = [
  "Approve budgets and project changes", "Billing tasks (urgent only)", "Customer contract and rate sheet",
  "Expense reports (questions only)", "Project closure", "Purchase orders (intercompany only)", "Reporting",
  "Revenue recognition", "Supplier invoices", "Transfer costs between projects", "Other",
];
const PROJECT_TYPES = ["Opportunity project", "Billable project", "Non-billable project", "Estimate", "Rebill", "Purchase order"];
const BUSINESS_UNITS = ["BU 01 Health", "BU 02 Consumer", "BU 03 Retail", "BU 04 Shared services"];

const portfolio = (options: string[]): FormField => ({ id: "portfolio", label: "Portfolio", kind: "select", required: true, options });
const businessUnit: FormField = { id: "business_unit", label: "Business unit", kind: "select", required: true, options: BUSINESS_UNITS };
const customer: FormField = { id: "customer", label: "Customer account", kind: "text", hint: "Left for you: the billing account doesn't always match the tracker's client name" };
const description = (required = false, label = "Description"): FormField => ({ id: "description", label, kind: "textarea", required });
const attachment = (required = false): FormField => ({ id: "attachment", label: "Attachment", kind: "file", required });
const quantity: FormField = { id: "quantity", label: "Quantity", kind: "number", required: true };

/** Field lists per request type, in the order the real forms show them. */
export function formFields(typeId: string, portfolios: string[]): FormField[] {
  const pf = portfolio(portfolios);
  switch (typeId) {
    case "edit-project":
      return [pf, { id: "project_name", label: "Project name", kind: "text", required: true },
        { id: "project_type", label: "Project type", kind: "select", required: true, options: PROJECT_TYPES },
        description(true, "Describe the update needed for this project, with every detail needed to proceed"), attachment()];
    case "clean-up":
      return [pf, { id: "project_name", label: "Project name", kind: "text", required: true }, description(true), attachment()];
    case "time":
      return [pf, { id: "time_limit", label: "Time limit", kind: "select", required: true, options: ["Time entry", "Time move"] },
        description(), attachment(true)];
    case "contract-rate":
      return [pf, businessUnit, customer, description(), attachment()];
    case "billing":
    case "revenue":
      return [pf, businessUnit, customer, description(), attachment(), quantity];
    case "amend-contract":
      return [{ id: "project_id", label: "Project ID", kind: "text", required: true, hint: "Format: PRJ-0000" },
        { id: "contract_name", label: "Contract name", kind: "text" }, { ...pf, required: false }, { ...businessUnit, required: false },
        { id: "effective_date", label: "Effective date", kind: "date" },
        { id: "revenue_category", label: "Revenue category", kind: "select", options: ["Fee", "Out-of-pocket", "Pass-through", "Retainer"] },
        { id: "contract_amount", label: "Contract amount", kind: "number" }, { id: "quantity", label: "Quantity", kind: "number" },
        { id: "rate_sheet", label: "Contract rate sheet name", kind: "text" },
        { id: "attachment", label: "Roles and rates (attachment)", kind: "file" }, description()];
    case "tracker":
      return [{ id: "support_area", label: "Request type", kind: "select", options: SUPPORT_AREAS }, customer, description(), attachment()];
    case "budget-approval":
    case "closure":
      return [{ id: "support_area", label: "Support area", kind: "select", options: SUPPORT_AREAS }, customer, description(), attachment()];
    default:
      return [description(true), attachment()];
  }
}

/** What the platform fills in for each request type; everything else stays empty for the requester. */
export function prefill(typeId: string, text: string, p?: Project, e?: ExceptionRow): Prefill {
  const f: Prefill = { description: text };
  if (p) {
    f.portfolio = p.portfolio;
    if (typeId === "edit-project" || typeId === "clean-up") f.project_name = p.name;
  }
  if (typeId === "amend-contract") {
    if (e) f.project_id = e.project_id;
    if (p?.contract) f.contract_name = p.contract;
  }
  if (typeId === "budget-approval") f.support_area = "Approve budgets and project changes";
  if (typeId === "closure") f.support_area = "Project closure";
  if (typeId === "tracker") f.support_area = "Other";
  if (typeId === "time" && e?.rule === "stale_unapproved") f.time_limit = "Time entry";
  return f;
}
