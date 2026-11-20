import type { RuleId } from "./types";
import { ruleId } from "./data";

export type Planted = Partial<Record<RuleId, { planted: number; found: number }>>;

/** Planted vs found per rule when the viewer's snapshot doesn't carry it (inlined at build time). */
export const PLANTED_FALLBACK: Planted | undefined = __PLANTED__
  ? Object.fromEntries(Object.entries(__PLANTED__).map(([k, v]) => [ruleId(k), v]))
  : undefined;
