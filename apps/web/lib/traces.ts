import type { Answer } from "./types";

// Serverless instances don't share memory or /tmp, so /trace/{id} can miss on the API.
// Every answer already carries its stages; keep a browser copy as the fallback.
const KEY = "local-traces";
const MAX = 40;

export type LocalTrace = { trace_id: string; at: string; question: string; stages: Answer["stages"]; answer: Answer };

function read(): LocalTrace[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTrace(a: Answer) {
  const rec: LocalTrace = { trace_id: a.trace_id, at: new Date().toISOString(), question: a.question, stages: a.stages, answer: a };
  try {
    localStorage.setItem(KEY, JSON.stringify([rec, ...read().filter((t) => t.trace_id !== a.trace_id)].slice(0, MAX)));
  } catch {}
}

export const localTrace = (id: string) => read().find((t) => t.trace_id === id) ?? null;
export const localTraces = () => read();
