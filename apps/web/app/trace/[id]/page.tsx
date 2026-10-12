"use client";

import { use, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { TrustBadge } from "@/components/AnswerCard";
import { CodeBlock } from "@/components/Lineage";

const STAGE_NOTE: Record<string, { es: string; en: string }> = {
  normalize: { es: "Idioma, fecha de corte fija, detección de patrones inseguros", en: "Language, fixed as-of date, unsafe-pattern detection" },
  cache: { es: "Respuesta servida desde caché (pregunta + versión semántica)", en: "Answer served from cache (question + semantic version)" },
  match_verified: { es: "Match determinístico contra consultas verificadas (sin LLM)", en: "Deterministic match against verified queries (no LLM)" },
  route: { es: "Modelo rápido: workspace + intención", en: "Fast model: workspace + intent" },
  plan: { es: "Planificador con herramientas: QueryPlan, aclaración o rechazo", en: "Tool-using planner: QueryPlan, clarification or refusal" },
  validate: { es: "Plan validado contra la capa semántica", en: "Plan validated against the semantic layer" },
  apply_clarification: { es: "Aclaración aplicada al plan pendiente (sin LLM)", en: "Clarification applied to the pending plan (no LLM)" },
  compile: { es: "Compilador determinístico → SQL", en: "Deterministic compiler → SQL" },
  execute: { es: "Ejecución de solo lectura, timeout y tope de filas", en: "Read-only execution, timeout and row cap" },
  check_result: { es: "Chequeos: vacío, rangos, conciliación, frescura", en: "Checks: empty, bounds, reconciliation, freshness" },
  visualize: { es: "Reglas eligen el gráfico", en: "Rules choose the chart" },
  explain: { es: "Resumen armado solo con números del resultado", en: "Summary built only from result numbers" },
  sample_rows: { es: "Filas de origen para el linaje", en: "Source rows for lineage" },
};

export default function TracePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useI18n();
  const [tr, setTr] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.trace(id).then(setTr).catch(() => setErr(true));
  }, [id]);
  if (err) return <div className="page"><div className="callout bad">Trace {id} not found.</div></div>;
  if (!tr) return <div className="page"><div className="bar" /></div>;
  const a = tr.answer;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">trace {tr.trace_id} · {tr.at}</div>
          <h1 style={{ overflowWrap: "anywhere" }}>{tr.question}</h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <TrustBadge tier={a.tier} clarifying={a.status === "clarification"} />
            <span className="mono small faint">{a.latency_ms} ms · US$ {(a.cost?.usd ?? 0).toFixed(5)} · {a.cost?.input_tokens ?? 0} in / {a.cost?.output_tokens ?? 0} out · cache read {a.cost?.cache_read_tokens ?? 0}</span>
          </div>
        </div>
      </div>
      <div className="panel" style={{ padding: "4px 20px" }}>
        {tr.stages.map((s: any, i: number) => {
          const { stage, ms, sql, ...rest } = s;
          return (
            <div className="stage-row" key={i}>
              <div>
                <div className="name">{i + 1}. {stage}</div>
                <div className="small faint">{STAGE_NOTE[stage]?.[lang] ?? ""}</div>
              </div>
              <div className="mono small">{ms} ms</div>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {sql ? <CodeBlock code={sql} title="SQL" /> : null}
                {Object.keys(rest).length > 0 && <pre className="code wrap" style={{ maxHeight: 280 }}>{JSON.stringify(rest, null, 2)}</pre>}
              </div>
            </div>
          );
        })}
      </div>
      {a.cost?.calls?.length > 0 && (
        <div className="panel card">
          <h3>LLM calls</h3>
          <pre className="code wrap">{JSON.stringify(a.cost.calls, null, 2)}</pre>
        </div>
      )}
      <div className="panel card">
        <h3>{lang === "es" ? "Respuesta" : "Answer"}</h3>
        <p>{a.summary}</p>
      </div>
    </div>
  );
}
