import type { ExceptionRow, Project, ProjectDetail, RuleId, Snapshot } from "./types";

/**
 * Where the data comes from: the synthetic files in ../data (index.json, one snapshot per viewer, detail/),
 * compiled into lazy JS chunks at build time. The app never fetches data, so it runs as plain static files.
 */
export const STATIC = true;
const BASE = import.meta.env.BASE_URL;

type Loader = () => Promise<{ default: unknown }>;
const bundled: Record<string, Loader> = import.meta.glob<{ default: unknown }>("../data/**/*.json");

const fromBundle = async <T>(rel: string): Promise<T> => {
  const load = bundled[`../data/${rel}`];
  if (!load) throw new Error(`not in the app bundle: ${rel}`);
  return (await load()).default as T;
};

/** Rule ids written by other versions of the generator, mapped to the app's own. */
const RULE_ALIAS: Record<string, RuleId> = {
  zero_rate: "zero_rate_billable", missing_tracker: "missing_from_tracker", oop_mismatch: "oop_billable_mismatch",
};
export const ruleId = (r: string): RuleId => (RULE_ALIAS[r] ?? r) as RuleId;

function normalize(s: Snapshot): Snapshot {
  const projects = s.projects.map((p) => ({ ...p, budget_source: (p.budget_source === "tracker" ? "tracker" : "erp") as Project["budget_source"] }));
  const exceptions = s.exceptions.map((e) => ({ ...e, rule: ruleId(e.rule) }) as ExceptionRow);
  const planted = s.planted && Object.fromEntries(Object.entries(s.planted).map(([k, v]) => [ruleId(k), v]));
  return { ...s, projects, exceptions, planted };
}

export const asset = (path: string) => `${BASE}${path.replace(/^\//, "")}`;
export const loadIndex = <T>() => fromBundle<T>("index.json");
export const loadSnapshot = async (file: string) => normalize(await fromBundle<Snapshot>(file));

/** Original source files exist only in the real platform; the synthetic build shows where they would sit. */
export const sourceUrl = (_id: string): string | null => null;

/** The account director audience sees no rates (same rule as the generator's scope step). */
function adSafe(d: ProjectDetail): ProjectDetail {
  const rate = (c: string) => /\brate\b/i.test(c);
  const drop = (rep: ProjectDetail["po"], bad: (c: string) => boolean) => {
    const keep = rep.columns.map((c, k) => (bad(c) ? -1 : k)).filter((k) => k >= 0);
    return { ...rep, columns: keep.map((k) => rep.columns[k]), rows: rep.rows.map((r) => keep.map((k) => r[k])) };
  };
  return { ...d, hours: drop(d.hours, (c) => c === "Fee"), po: drop(d.po, rate), oop: drop(d.oop, rate),
    tracker: d.tracker && { ...d.tracker, fields: d.tracker.fields.filter((f) => !rate(f[1])) } };
}

/** Every source field for one project, within the viewer's scope. */
export async function loadDetail(_viewerFile: string, projectId: string, role?: string): Promise<ProjectDetail | null> {
  const index = await fromBundle<Record<string, string>>("detail/index.json").catch(() => null);
  const name = index?.[projectId];
  if (!name) return null;
  const d = (await fromBundle<Record<string, ProjectDetail>>(`detail/${name}`))[projectId] ?? null;
  return d && role === "AD" ? adSafe(d) : d;
}
