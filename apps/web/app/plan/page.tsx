"use client";

import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type T = { es: string; en: string };

const PHASES: { when: T; title: T; goal: T; items: T[]; gate: T }[] = [
  {
    when: { es: "Días 1–30", en: "Days 1–30" },
    title: { es: "Entender y acordar", en: "Understand and agree" },
    goal: { es: "Antes de escribir código: saber qué tableros importan y qué significa cada número.", en: "Before writing code: know which dashboards matter and what each number means." },
    items: [
      { es: "Inventario de tableros de QuickSight y de los 5 que más usan los clientes.", en: "Inventory of QuickSight dashboards and the 5 clients use most." },
      { es: "Glosario de métricas por estándar: qué es exactamente “hectárea verificada” para EUDR, ISCC, 45Z…", en: "Metric glossary per standard: what exactly “verified hectare” means for EUDR, ISCC, 45Z…" },
      { es: "Mapa campo de QuickSight → métrica semántica, marcando cálculos que hoy promedian ratios.", en: "Map QuickSight field → semantic metric, flagging calcs that average ratios today." },
      { es: "Relevamiento de datos: qué vive en Mongo y qué en Postgres, frescura y huecos.", en: "Data survey: what lives in Mongo vs Postgres, freshness and gaps." },
      { es: "Set dorado inicial con 50+ preguntas reales (de soporte, ventas y clientes) con su respuesta esperada.", en: "Initial golden set of 50+ real questions (support, sales, clients) with expected answers." },
      { es: "Primer workspace: cumplimiento EUDR (las obligaciones aplican desde el 30/12/2026).", en: "First workspace: EUDR compliance (obligations apply from 30 Dec 2026)." },
    ],
    gate: { es: "Glosario firmado por BI y producto. Sin métricas acordadas no se construye.", en: "Glossary signed off by BI and product. No agreed metrics, no build." },
  },
  {
    when: { es: "Días 31–60", en: "Days 31–60" },
    title: { es: "Construir la capa con evaluaciones", en: "Build the layer, with evals" },
    goal: { es: "La capa semántica, el compilador y las evaluaciones sobre los datos reales, sin tocar lo que ya funciona.", en: "Semantic layer, compiler and evals on real data, without touching what already works." },
    items: [
      { es: "Capa semántica versionada en el repo + linter en CI (referencias, joins no declarados, sinónimos).", en: "Versioned semantic layer in the repo + linter in CI (references, undeclared joins, synonyms)." },
      { es: "Marts anchos por proceso (lote-campaña, evaluación de cambio de uso, lotes de producto) sobre Postgres/PostGIS.", en: "Wide marts per process (field-season, land-use assessment, product lots) on Postgres/PostGIS." },
      { es: "Compilador determinístico y rol de solo lectura a nivel base.", en: "Deterministic compiler and a database-level read-only role." },
      { es: "8–12 consultas verificadas para las preguntas más frecuentes.", en: "8–12 verified queries for the most frequent questions." },
      { es: "Evaluaciones por etapa en CI; piloto interno con el equipo de BI.", en: "Per-stage evals in CI; internal pilot with the BI team." },
    ],
    gate: { es: "≥ 95 % de precisión en el set dorado, 100 % en rechazos e inyección, y cero diferencias contra QuickSight en los 5 tableros clave.", en: "≥ 95% accuracy on the golden set, 100% on refusals and injection, and zero differences vs QuickSight on the 5 key dashboards." },
  },
  {
    when: { es: "Días 61–90", en: "Days 61–90" },
    title: { es: "Migrar y pilotear con clientes", en: "Migrate and pilot with clients" },
    goal: { es: "Los tableros nuevos conviven con QuickSight hasta que los números coinciden.", en: "New dashboards run alongside QuickSight until the numbers match." },
    items: [
      { es: "Reconstruir los 5 tableros clave como specs (preguntas + planes), con QuickSight en paralelo.", en: "Rebuild the 5 key dashboards as specs (questions + plans), with QuickSight in parallel." },
      { es: "Piloto con 1–2 clientes en tableros de cumplimiento EUDR.", en: "Pilot with 1–2 clients on EUDR compliance dashboards." },
      { es: "Circuito de feedback: cada 👎 se revisa y puede pasar al set dorado.", en: "Feedback loop: every 👎 is reviewed and can be promoted to the golden set." },
      { es: "Monitoreo de costo, latencia y preguntas sin respuesta (que guían el próximo modelado).", en: "Monitoring of cost, latency and unanswered questions (which drive the next modeling)." },
    ],
    gate: { es: "OK del piloto y reporte de paridad. Recién entonces se apaga el tablero viejo correspondiente.", en: "Pilot sign-off and a parity report. Only then is the matching old dashboard switched off." },
  },
];

const RISKS: [T, T][] = [
  [{ es: "Definiciones distintas entre áreas", en: "Different definitions across teams" }, { es: "Se resuelve en la fase 1 con el glosario firmado, antes de escribir código.", en: "Resolved in phase 1 with the signed glossary, before writing code." }],
  [{ es: "Tentación de dejar que la IA escriba SQL libre para ir más rápido", en: "Temptation to let the AI write free SQL to go faster" }, { es: "Compilador determinístico; SQL libre solo como modo exploratorio etiquetado y apagado por defecto.", en: "Deterministic compiler; free SQL only as a labeled exploratory mode, off by default." }],
  [{ es: "Joins de varios saltos (la causa principal de errores)", en: "Multi-hop joins (the main failure mode)" }, { es: "Se arreglan con modelado (marts anchos), no con prompts. Join no declarado = rechazo + registro de brecha.", en: "Fixed with modeling (wide marts), not prompts. Undeclared join = refusal + gap logged." }],
  [{ es: "Costo de LLM", en: "LLM cost" }, { es: "Consultas verificadas sin LLM, caché, modelo barato para ruteo. Medido hoy: ~US$ 0,002 por pregunta en promedio.", en: "Verified queries without LLM, caching, a cheap routing model. Measured today: ~US$ 0.002 per question on average." }],
  [{ es: "Confianza del cliente en números generados", en: "Client trust in generated numbers" }, { es: "Nivel de confianza visible, linaje completo y advertencias de chequeos en cada respuesta.", en: "Visible trust tier, full lineage and check warnings on every answer." }],
];

export default function Plan() {
  const { lang } = useI18n();
  const l = lang;
  const es = l === "es";
  return (
    <div className="page doc">
      <div className="page-head">
        <div>
          <div className="eyebrow">{es ? "Propuesta" : "Proposal"}</div>
          <h1>{es ? "De QuickSight a tableros generados con IA, en 90 días" : "From QuickSight to AI-generated dashboards, in 90 days"}</h1>
          <p className="lead" style={{ marginTop: 8 }}>
            {es
              ? "Primero entender y acordar las métricas; después construir la capa con evaluaciones; recién al final migrar, con QuickSight en paralelo. Nada se apaga hasta que el tablero nuevo dé los mismos números."
              : "First understand and agree on metrics; then build the layer with evals; only then migrate, with QuickSight in parallel. Nothing is switched off until the new dashboard gives the same numbers."}
          </p>
        </div>
        <button className="btn no-print" onClick={() => window.print()}>{es ? "Imprimir / PDF" : "Print / PDF"}</button>
      </div>

      <div className="panel" style={{ padding: "4px 20px" }}>
        <div className="timeline">
          {PHASES.map((p, i) => (
            <div key={i} className="phase">
              <div className="when">
                <span className="eyebrow">{es ? "Fase" : "Phase"} {i + 1}</span>
                <b>{p.when[l]}</b>
              </div>
              <div>
                <h2>{p.title[l]}</h2>
                <p className="muted" style={{ marginTop: 4 }}>{p.goal[l]}</p>
                <ul>{p.items.map((it, j) => <li key={j}>{it[l]}</li>)}</ul>
                <div className="gate"><CheckCircle2 size={16} color="var(--ok)" style={{ flex: "none", marginTop: 2 }} /><span><b>Gate:</b> {p.gate[l]}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Cómo se mide el éxito a los 90 días" : "How success is measured at 90 days"}</h2>
        <div className="kpi-grid">
          {[
            [es ? "Tiempo para un tablero nuevo" : "Time to a new dashboard", es ? "días → minutos" : "days → minutes"],
            [es ? "Precisión en el set dorado" : "Golden-set accuracy", "≥ 95 %"],
            [es ? "Preguntas respondidas con métricas gobernadas" : "Questions answered with governed metrics", "≥ 80 %"],
            [es ? "Diferencias contra QuickSight (top 5)" : "Differences vs QuickSight (top 5)", "0"],
          ].map(([k, v]) => (
            <div key={k} className="kpi-card" style={{ cursor: "default", minHeight: 0 }}>
              <span className="eyebrow">{k}</span>
              <span className="kpi-v">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Riesgos y cómo los manejo" : "Risks and how I handle them"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{es ? "Riesgo" : "Risk"}</th><th>{es ? "Mitigación" : "Mitigation"}</th></tr></thead>
            <tbody>{RISKS.map(([r, m], i) => <tr key={i}><td><b>{r[l]}</b></td><td>{m[l]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel card">
          <h3>{es ? "Qué entrego" : "What I deliver"}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>{es ? "Glosario de métricas y mapa QuickSight → capa semántica" : "Metric glossary and QuickSight → semantic layer map"}</li>
            <li>{es ? "Capa semántica + compilador + rol de solo lectura" : "Semantic layer + compiler + read-only role"}</li>
            <li>{es ? "Set dorado y evaluaciones en CI con gates" : "Golden set and gated evals in CI"}</li>
            <li>{es ? "5 tableros clave migrados, con reporte de paridad" : "5 key dashboards migrated, with a parity report"}</li>
            <li>{es ? "Panel de trazas, costo y preguntas sin respuesta" : "Traces, cost and unanswered-questions panel"}</li>
          </ul>
        </div>
        <div className="panel card">
          <h3>{es ? "Qué necesito del equipo" : "What I need from the team"}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>{es ? "Acceso de lectura a Mongo, Postgres y a los datasets de QuickSight" : "Read access to Mongo, Postgres and the QuickSight datasets"}</li>
            <li>{es ? "Un referente de producto/cumplimiento por estándar para el glosario" : "A product/compliance owner per standard for the glossary"}</li>
            <li>{es ? "Preguntas reales de clientes y de soporte para el set dorado" : "Real client and support questions for the golden set"}</li>
            <li>{es ? "1–2 clientes dispuestos a pilotear" : "1–2 clients willing to pilot"}</li>
            <li>{es ? "Definir proveedor de LLM y restricciones de costo/privacidad" : "Agree on the LLM provider and cost/privacy constraints"}</li>
          </ul>
        </div>
      </section>
      <p className="footer-note">{es ? "Propuesta independiente basada en información pública. La demo usa datos sintéticos." : "Independent proposal based on public information. The demo uses synthetic data."}</p>
    </div>
  );
}
