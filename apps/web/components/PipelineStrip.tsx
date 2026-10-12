"use client";

import type { Answer, Lang } from "@/lib/types";

const LABEL: Record<string, { es: string; en: string }> = {
  normalize: { es: "Normalizar", en: "Normalize" },
  cache: { es: "Caché", en: "Cache" },
  match_verified: { es: "Match verificado", en: "Verified match" },
  route: { es: "Router (IA)", en: "Router (AI)" },
  plan: { es: "Planner (IA)", en: "Planner (AI)" },
  apply_clarification: { es: "Aclaración", en: "Clarification" },
  validate: { es: "Validar", en: "Validate" },
  compile: { es: "Compilar SQL", en: "Compile SQL" },
  execute: { es: "Ejecutar (RO)", en: "Execute (RO)" },
  check_result: { es: "Chequeos", en: "Checks" },
  visualize: { es: "Gráfico", en: "Chart" },
  explain: { es: "Resumen", en: "Summary" },
  sample_rows: { es: "Linaje", en: "Lineage" },
  spend_guard: { es: "Presupuesto", en: "Budget" },
  llm_error: { es: "Error IA", en: "AI error" },
};
const AI = new Set(["route", "plan"]);

export function PipelineStrip({ answer, lang }: { answer: Answer; lang: Lang }) {
  const stages = answer.stages.filter((s) => LABEL[s.stage]);
  if (!stages.length) return null;
  const vm = stages.find((s) => s.stage === "match_verified") as any;
  return (
    <div className="pipe" aria-label={lang === "es" ? "Etapas del pipeline" : "Pipeline stages"}>
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
        <span className="pipe-note">{lang === "es" ? "Sin llamadas a IA: respuesta 100 % determinística" : "No AI calls: fully deterministic answer"}</span>
      )}
    </div>
  );
}
