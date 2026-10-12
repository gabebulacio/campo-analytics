import type { Answer, Lang, QueryPlan } from "./types";

// Next.js rewrites /api/pipeline/* to PIPELINE_URL (see next.config.mjs).
const BASE = "/api/pipeline";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(BASE + path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  if (!r.ok) {
    let detail = `${r.status}`;
    try {
      const j = await r.json();
      detail = typeof j.detail === "string" ? j.detail : j.detail?.es || j.detail?.en || JSON.stringify(j.detail);
    } catch {}
    throw new Error(detail);
  }
  return r.json();
}

export const api = {
  ask: (body: { question: string; clarification?: string; lang?: Lang; pending_plan?: QueryPlan; dimension?: string }) =>
    req<Answer>("/ask", { method: "POST", body: JSON.stringify(body) }),
  health: () => req<{ status: string; engine: string; llm_configured: boolean; semantic_version: string; metrics: number; planner_model: string; as_of: string }>("/health"),
  suggestions: (lang: Lang) => req<{ question: string; workspace: string; verified: boolean }[]>(`/suggestions?lang=${lang}`),
  catalog: () => req<any>("/catalog"),
  trace: (id: string) => req<any>(`/trace/${id}`),
  traces: () => req<any[]>("/traces"),
  feedback: (trace_id: string, rating: "up" | "down") => req("/feedback", { method: "POST", body: JSON.stringify({ trace_id, rating }) }),
  evals: () => req<any>("/evals/latest"),
  overview: () => req<any>("/overview"),
};
