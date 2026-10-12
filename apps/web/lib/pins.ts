// Dashboard spec: pinned tiles store the question + plan, never raw data.
// Kept in localStorage for the demo (Phase 5 moves specs to Postgres).
import type { QueryPlan } from "./types";

export interface Tile {
  id: string;
  question: string;
  clarification?: string | null;
  plan?: QueryPlan;
  pinned_at: string;
}
export interface DashboardSpec {
  version: 1;
  name: string;
  tiles: Tile[];
}

const KEY = "dashboard:v1";

export function loadDashboard(): DashboardSpec {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d: DashboardSpec = JSON.parse(raw);
      if (d.name === "Mi tablero") d.name = "My dashboard"; // old default, still in some browsers
      return d;
    }
  } catch {}
  return { version: 1, name: "My dashboard", tiles: [] };
}

export function saveDashboard(d: DashboardSpec) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}

export function pin(t: Omit<Tile, "id" | "pinned_at">): DashboardSpec {
  const d = loadDashboard();
  if (!d.tiles.some((x) => x.question === t.question && x.clarification === t.clarification)) {
    d.tiles.push({ ...t, id: Math.random().toString(36).slice(2, 10), pinned_at: new Date().toISOString() });
    saveDashboard(d);
  }
  return d;
}

export function isPinned(question: string, clarification?: string | null): boolean {
  return loadDashboard().tiles.some((x) => x.question === question && (x.clarification ?? null) === (clarification ?? null));
}
