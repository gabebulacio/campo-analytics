// Mirrors packages/schemas/answer.schema.json (generated from the Python models).
export type Lang = "es" | "en";
export type I18n = Record<Lang, string>;
export type Tier = "VERIFIED" | "GOVERNED" | "EXPLORATORY" | "NOT_ANSWERED" | null;

export interface ColumnMeta {
  name: string;
  kind: "dimension" | "metric";
  label: I18n;
  unit?: string;
  time?: boolean;
}

export interface ChartSpec {
  type: "kpi" | "line" | "bar" | "grouped_bar" | "stacked_bar" | "table" | "map";
  x: string | null;
  series: string | null;
  y: string;
  metrics: string[];
  unit: string;
  reason: string;
}

export interface Warning {
  code: string;
  level: "info" | "warn" | "bad";
  message: I18n;
}

export interface Component {
  aggregate: string;
  expr: string;
  entity: string;
  table: string;
  filters: string[];
}

export interface MetricDef {
  name: string;
  label: I18n;
  description: string;
  type: string;
  unit: string;
  workspace: string;
  component: Component | null;
  numerator: Component | null;
  denominator: Component | null;
  numerator_metric: string | null;
  denominator_metric: string | null;
  requires_filter_or_group: string[];
}

export interface QueryPlan {
  metrics: string[];
  dimensions: string[];
  filters: { dimension: string; op: string; values: string[] }[];
  sort: { field: string; direction: string }[];
  limit: number | null;
  chart_hint: string | null;
}

export interface Lineage {
  metrics: MetricDef[];
  plan: QueryPlan;
  sql: string;
  params: string[];
  source_tables: string[];
  upstream: { table: string; entity: string; grain: string; source: string }[];
  row_count: number;
  sample: { sql?: string; columns?: string[]; rows?: unknown[][]; error?: string } | null;
  as_of: string;
  semantic_version: string;
  verified_query: { id: string; owner: string; verified_at: string; canonical_question: string; params: Record<string, string>; score: number } | null;
  engine: string;
  data_origin: string;
}

export interface Answer {
  trace_id: string;
  question: string;
  clarification: string | null;
  language: Lang;
  status: "answered" | "clarification" | "not_answered";
  tier: Tier;
  summary: string;
  summary_i18n?: I18n;
  chart?: ChartSpec;
  headline?: { metric: string; label: I18n; unit: string; value: number | null }[];
  geo?: { dimension: string; points: Record<string, [number, number]> } | null;
  data?: { columns: string[]; rows: (string | number | null)[][]; meta: ColumnMeta[]; truncated: boolean };
  warnings: Warning[];
  plan?: QueryPlan;
  pending_plan?: QueryPlan;
  lineage?: Lineage;
  clarify?: ClarificationReq;
  refusal?: { code: string; message: I18n; closest: { metric: string; label: I18n; description: string; question: I18n }[]; suggestions: { question: string; verified_query_id: string }[] };
  as_of: string;
  semantic_version: string;
  engine: string;
  latency_ms: number;
  cost: { usd: number; input_tokens: number; output_tokens: number; cache_read_tokens?: number; calls?: unknown[] };
  stages: { stage: string; ms: number; [k: string]: unknown }[];
  cached_from?: string;
  refines?: string;
}

export interface ClarificationReq {
  question: string;
  options: string[];
  dimension?: string;
}
