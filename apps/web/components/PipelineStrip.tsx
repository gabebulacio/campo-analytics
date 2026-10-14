"use client";

import type { Answer, Lang } from "@/lib/types";

const LABEL: Record<string, { he: string; en: string }> = {
  normalize: { he: "נרמול", en: "Normalize" },
  cache: { he: "מטמון", en: "Cache" },
  match_verified: { he: "התאמה מאומתת", en: "Verified match" },
  follow_up: { he: "כוונון", en: "Follow-up" },
  route: { he: "Router (AI)", en: "Router (AI)" },
  plan: { he: "Planner (AI)", en: "Planner (AI)" },
  apply_clarification: { he: "הבהרה", en: "Clarification" },
  validate: { he: "אימות", en: "Validate" },
  compile: { he: "הידור SQL", en: "Compile SQL" },
  execute: { he: "הרצה (RO)", en: "Execute (RO)" },
  check_result: { he: "בדיקות", en: "Checks" },
  visualize: { he: "גרף", en: "Chart" },
  explain: { he: "סיכום", en: "Summary" },
  sample_rows: { he: "שושלת", en: "Lineage" },
  spend_guard: { he: "תקציב", en: "Budget" },
  llm_error: { he: "שגיאת AI", en: "AI error" },
};
const AI = new Set(["route", "plan"]);

export function PipelineStrip({ answer, lang }: { answer: Answer; lang: Lang }) {
  const stages = answer.stages.filter((s) => LABEL[s.stage]);
  if (!stages.length) return null;
  const vm = stages.find((s) => s.stage === "match_verified") as any;
  return (
    <div className="pipe" aria-label={lang === "he" ? "שלבי ה-pipeline" : "Pipeline stages"}>
      {stages.map((s, i) => {
        const ai = AI.has(s.stage);
        const hit = s.stage === "match_verified" && vm?.matched;
        return (
          <span key={i} className={`pipe-step ${ai ? "ai" : ""} ${hit ? "hit" : ""} ${s.stage === "llm_error" ? "err" : ""}`} title={JSON.stringify(s).slice(0, 400)}>
            <span className="pipe-name">{LABEL[s.stage][lang]}</span>
            <span className="pipe-ms">{s.ms} ms</span>
          </span>
        );
      })}
      {!stages.some((s) => AI.has(s.stage)) && answer.status === "answered" && (
        <span className="pipe-note">{lang === "he" ? "בלי קריאות ל-AI: תשובה דטרמיניסטית ב-100%" : "No AI calls: fully deterministic answer"}</span>
      )}
    </div>
  );
}
