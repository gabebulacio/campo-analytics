"use client";

import { useEffect, useState } from "react";
import { CircleSlash, FlaskConical, Layers, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

type T = { es: string; en: string };
const tx = (o: T, l: "es" | "en") => o[l];

function Box({ x, y, w, h, cls, title, sub }: { x: number; y: number; w: number; h: number; cls: string; title: string; sub?: string }) {
  return (
    <g>
      <rect className={`box ${cls}`} x={x} y={y} width={w} height={h} rx={8} />
      <text className="t" x={x + 12} y={y + 22}>{title}</text>
      {sub && sub.split("\n").map((line, i) => <text key={i} className="s" x={x + 12} y={y + 40 + i * 15}>{line}</text>)}
    </g>
  );
}

function Diagram({ l }: { l: "es" | "en" }) {
  const es = l === "es";
  const stages: [string, string, string][] = [
    ["det", es ? "Normalizar" : "Normalize", es ? "idioma · as_of\ninyección" : "language · as_of\ninjection"],
    ["ok", es ? "Verificado" : "Verified", es ? "consultas de\nconfianza · 0 IA" : "trusted queries\nno AI"],
    ["ai", "Router", "Haiku 5.5\nworkspace"],
    ["ai", "Planner", "Sonnet 5.5\nQueryPlan"],
    ["det", es ? "Validador" : "Validator", es ? "catálogo\n1 reparación" : "catalog\n1 repair"],
    ["det", es ? "Compilador" : "Compiler", es ? "plan → SQL\njoins declarados" : "plan → SQL\ndeclared joins"],
    ["det", es ? "Ejecutor" : "Executor", es ? "solo lectura\n5 s · 5.000 filas" : "read-only\n5 s · 5,000 rows"],
    ["det", es ? "Chequeos" : "Checks", es ? "rangos\nconciliación" : "bounds\nreconciliation"],
  ];
  const sw = 104, gap = 14, x0 = 20, y0 = 196;
  return (
    <svg viewBox="0 0 1100 520" role="img" aria-label={es ? "Diagrama de arquitectura" : "Architecture diagram"}>
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" className="ah" /></marker>
      </defs>
      {/* row 1: user + web */}
      <Box x={20} y={20} w={200} h={74} cls="" title={es ? "Usuario de negocio" : "Business user"} sub={es ? "pregunta en ES / EN" : "question in ES / EN"} />
      <Box x={260} y={20} w={250} h={74} cls="" title="Web · Next.js (Vercel)" sub={es ? "respuesta + gráfico + linaje\ntableros como specs JSON" : "answer + chart + lineage\ndashboards as JSON specs"} />
      <Box x={550} y={20} w={250} h={74} cls="" title="API · FastAPI (Cloud Run)" sub={es ? "pipeline por etapas\ntraza por pregunta" : "staged pipeline\none trace per question"} />
      <Box x={840} y={20} w={240} h={74} cls="ai" title="Claude API" sub={es ? "solo elige y combina\nnunca escribe SQL ni números" : "chooses and combines only\nnever writes SQL or numbers"} />
      <path className="arr" d="M220 57 H258" markerEnd="url(#ah)" />
      <path className="arr" d="M510 57 H548" markerEnd="url(#ah)" />
      <path className="arr" d="M800 57 H838" markerEnd="url(#ah)" />
      <text className="lbl" x={562} y={128}>{es ? "PIPELINE DE RESPUESTA" : "ANSWER PIPELINE"}</text>
      <path className="arr" d="M675 94 V170 H80 V190" markerEnd="url(#ah)" />
      {stages.map(([cls, t, s], i) => {
        const x = x0 + i * (sw + gap);
        return (
          <g key={t}>
            <Box x={x} y={y0} w={sw} h={78} cls={cls} title={t} sub={s} />
            {i < stages.length - 1 && <path className="arr" d={`M${x + sw} ${y0 + 39} H${x + sw + gap - 2}`} markerEnd="url(#ah)" />}
          </g>
        );
      })}
      <Box x={x0 + 8 * (sw + gap)} y={y0} w={116} h={78} cls="ok" title={es ? "Respuesta" : "Answer"} sub={es ? "confianza\n+ linaje" : "trust tier\n+ lineage"} />
      <path className="arr" d={`M${x0 + 8 * (sw + gap) - gap} ${y0 + 39} H${x0 + 8 * (sw + gap) - 2}`} markerEnd="url(#ah)" />
      {/* semantic layer */}
      <Box x={300} y={312} w={500} h={74} cls="det" title={es ? "Capa semántica (YAML versionado)" : "Semantic layer (versioned YAML)"} sub={es ? "35 métricas · dimensiones · joins declarados\nconsultas verificadas · valores · brechas conocidas" : "35 metrics · dimensions · declared joins\nverified queries · values · known gaps"} />
      <path className="arr" d="M420 312 V276" markerEnd="url(#ah)" />
      <path className="arr" d="M550 312 V276" markerEnd="url(#ah)" />
      <path className="arr" d="M680 312 V276" markerEnd="url(#ah)" />
      {/* data */}
      <Box x={20} y={420} w={240} h={78} cls="data" title="MongoDB (raw)" sub={es ? "Crop Story · geometrías GeoJSON\nalertas · formularios" : "Crop Story · GeoJSON geometries\nalerts · forms"} />
      <Box x={300} y={420} w={240} h={78} cls="data" title="ELT" sub={es ? "raw → staging → marts\ntests de calidad de datos" : "raw → staging → marts\ndata-quality tests"} />
      <Box x={580} y={420} w={240} h={78} cls="data" title={es ? "Postgres + PostGIS (marts)" : "Postgres + PostGIS (marts)"} sub={es ? "un mart ancho por proceso\nrol app_reader (solo SELECT)" : "one wide mart per process\napp_reader role (SELECT only)"} />
      <Box x={860} y={420} w={220} h={78} cls="ok" title={es ? "Evaluaciones + trazas" : "Evals + traces"} sub={es ? "set dorado por etapa · CI\nreplay /trace/{id}" : "per-stage golden set · CI\n/trace/{id} replay"} />
      <path className="arr" d="M260 459 H298" markerEnd="url(#ah)" />
      <path className="arr" d="M540 459 H578" markerEnd="url(#ah)" />
      <path className="arr" d="M800 420 V276" markerEnd="url(#ah)" />
      <text className="lbl" x={812} y={404}>{es ? "SQL compilado" : "compiled SQL"}</text>
    </svg>
  );
}

export default function Architecture() {
  const { lang } = useI18n();
  const l = lang;
  const es = l === "es";
  const [rep, setRep] = useState<any>(null);
  useEffect(() => {
    api.evals().then(setRep).catch(() => {});
  }, []);
  const pct = (v?: number | null) => (v === null || v === undefined ? "–" : `${(v * 100).toFixed(1)}%`);

  const principles: [T, T][] = [
    [{ es: "La IA elige y combina; no calcula", en: "The AI chooses and combines; it doesn't calculate" }, { es: "El modelo devuelve un QueryPlan tipado (métricas, dimensiones, filtros). Nunca escribe SQL ni números.", en: "The model returns a typed QueryPlan (metrics, dimensions, filters). It never writes SQL or numbers." }],
    [{ es: "La lógica vive en la capa semántica", en: "Logic lives in the semantic layer" }, { es: "Cocientes de sumas, hectáreas contadas una vez, estándar obligatorio: reglas en YAML versionado, no en prompts.", en: "Ratio of sums, hectares counted once, required standard: rules in versioned YAML, not prompts." }],
    [{ es: "SQL determinístico", en: "Deterministic SQL" }, { es: "Mismo plan → mismo SQL, byte a byte. Solo joins declarados. Snapshot tests en CI.", en: "Same plan → same SQL, byte for byte. Declared joins only. Snapshot tests in CI." }],
    [{ es: "Mejor un “no sé” que un número malo", en: "Better “I don't know” than a wrong number" }, { es: "Si falta una métrica, rechaza y ofrece lo más cercano. Las brechas conocidas están declaradas.", en: "If a metric is missing, it refuses and offers the closest. Known gaps are declared." }],
    [{ es: "Cada número es trazable", en: "Every number is traceable" }, { es: "Definición, plan, SQL, tablas de origen, filas de muestra, fecha de corte y versión semántica.", en: "Definition, plan, SQL, source tables, sample rows, as-of date and semantic version." }],
    [{ es: "Las evaluaciones son producto", en: "Evals are product" }, { es: "Set dorado puntuado por etapa; CI bloquea si baja la precisión. Nunca se usa como few-shot.", en: "Golden set scored per stage; CI blocks if accuracy drops. Never used as few-shot." }],
  ];

  return (
    <div className="page doc">
      <div className="page-head">
        <div>
          <div className="eyebrow">{es ? "Arquitectura" : "Architecture"}</div>
          <h1>{es ? "BI generativo sobre una capa semántica gobernada" : "Generative BI over a governed semantic layer"}</h1>
          <p className="lead" style={{ marginTop: 8 }}>
            {es
              ? "Un usuario hace una pregunta de negocio y recibe un tablero en segundos. La IA interpreta y elige; las definiciones, los joins y el SQL son determinísticos y auditables."
              : "A user asks a business question and gets a dashboard in seconds. The AI interprets and chooses; definitions, joins and SQL are deterministic and auditable."}
          </p>
        </div>
        <button className="btn no-print" onClick={() => window.print()}>{es ? "Imprimir / PDF" : "Print / PDF"}</button>
      </div>

      <p className="small muted show-mobile">{es ? "Deslizá el diagrama hacia los costados para verlo completo." : "Swipe the diagram sideways to see all of it."}</p>
      <div className="panel diagram">
        <Diagram l={l} />
        <div className="legend-row">
          <span><i style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }} />{es ? "IA (Claude)" : "AI (Claude)"}</span>
          <span><i style={{ borderColor: "var(--link)", background: "var(--link-soft)" }} />{es ? "Determinístico" : "Deterministic"}</span>
          <span><i style={{ borderColor: "var(--ok)", background: "var(--ok-soft)" }} />{es ? "Confianza / control" : "Trust / control"}</span>
          <span><i style={{ borderColor: "var(--line-strong)", background: "var(--surface-2)" }} />{es ? "Datos" : "Data"}</span>
        </div>
      </div>

      {rep && (
        <section className="kpi-grid">
          {[
            [es ? "Precisión de resultado" : "Result accuracy", pct(rep.scores.result_accuracy)],
            [es ? "Rechazos correctos" : "Refusal correctness", pct(rep.scores.refusal_correctness)],
            [es ? "Resistencia a inyección" : "Injection resistance", pct(rep.scores.injection_resistance)],
            [es ? "Costo promedio por pregunta" : "Average cost per question", `US$ ${(rep.scores.cost_per_question_usd ?? 0).toFixed(4)}`],
          ].map(([k, v]) => (
            <div key={k} className="kpi-card" style={{ cursor: "default", minHeight: 0 }}>
              <span className="eyebrow">{k}</span>
              <span className="kpi-v">{v}</span>
              <span className="small faint">{es ? "Set dorado" : "Golden set"} · {rep.cases} {es ? "casos" : "cases"} · {rep.generated_at}</span>
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Principios" : "Principles"}</h2>
        <div className="cards-3">
          {principles.map(([t, d], i) => (
            <div key={i} className="panel card-n">
              <span className="n">0{i + 1}</span>
              <h3>{tx(t, l)}</h3>
              <p className="muted small">{tx(d, l)}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Niveles de confianza de cada respuesta" : "Trust tier of every answer"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{es ? "Nivel" : "Tier"}</th><th>{es ? "Cuándo" : "When"}</th><th>{es ? "Qué ve el usuario" : "What the user sees"}</th></tr></thead>
            <tbody>
              <tr><td><span className="badge b-ok"><ShieldCheck size={13} />{es ? "Verificado" : "Verified"}</span></td><td>{es ? "Coincide con una consulta verificada; solo se completan parámetros." : "Matches a verified query; only parameters are filled."}</td><td>{es ? "Dueño y fecha de verificación. Costo de IA: 0." : "Owner and verification date. AI cost: 0."}</td></tr>
              <tr><td><span className="badge b-info"><Layers size={13} />{es ? "Gobernado" : "Governed"}</span></td><td>{es ? "QueryPlan sobre métricas definidas que pasó todas las validaciones." : "QueryPlan over defined metrics that passed every validator."}</td><td>{es ? "Linaje completo y advertencias de los chequeos." : "Full lineage and check warnings."}</td></tr>
              <tr><td><span className="badge b-warn"><FlaskConical size={13} />{es ? "Exploratorio" : "Exploratory"}</span></td><td>{es ? "SQL libre detrás de un flag (apagado en la demo pública)." : "Free SQL behind a flag (off in the public demo)."}</td><td>{es ? "SQL expandido y aviso de revisar." : "SQL expanded and a review notice."}</td></tr>
              <tr><td><span className="badge b-none"><CircleSlash size={13} />{es ? "Sin respuesta" : "Not answered"}</span></td><td>{es ? "Fuera de alcance, ambigua tras una aclaración o validación fallida." : "Out of scope, ambiguous after one clarification, or failed validation."}</td><td>{es ? "Explicación simple y métricas más cercanas." : "Plain explanation and the closest metrics."}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Stack" : "Stack"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{es ? "Capa" : "Layer"}</th><th>{es ? "Demo" : "Demo"}</th><th>{es ? "Producción" : "Production"}</th></tr></thead>
            <tbody>
              {[
                ["Web", "Next.js 15 · Recharts · Leaflet", "Vercel"],
                ["API", "FastAPI · Pydantic · sqlglot", "Cloud Run (min 0)"],
                [es ? "Datos analíticos" : "Analytical data", "DuckDB (read-only)", "Postgres + PostGIS (Neon), app_reader"],
                [es ? "Datos crudos" : "Raw data", "JSONL (Mongo-shaped)", "MongoDB Atlas"],
                ["LLM", "Claude Haiku 5.5 (router) · Sonnet 5.5 (planner)", es ? "Igual; el modelo se elige por costo con las evals" : "Same; model chosen on cost via evals"],
                ["CI", "GitHub Actions", es ? "Lint, tests, linter semántico, evals con gates" : "Lint, tests, semantic linter, gated evals"],
              ].map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? "" : "small"}>{i === 0 ? <b>{c}</b> : c}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{es ? "Patrones de casos en producción" : "Patterns from production systems"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{es ? "Patrón" : "Pattern"}</th><th>{es ? "Fuente" : "Source"}</th><th>{es ? "Acá" : "Here"}</th></tr></thead>
            <tbody>
              <tr><td>{es ? "El LLM descompone en métricas + dimensiones; un motor genera el SQL" : "LLM decomposes into metrics + dimensions; an engine writes SQL"}</td><td className="small muted">dbt Labs (2023, 2026)</td><td className="small">QueryPlan + {es ? "compilador" : "compiler"}</td></tr>
              <tr><td>{es ? "La precisión depende de la capa semántica más que del modelo" : "Accuracy depends on the semantic layer more than the model"}</td><td className="small muted">Cube (2026)</td><td className="small">{es ? "Modelo como config; comparado en evals" : "Model as config; compared in evals"}</td></tr>
              <tr><td>{es ? "Workspaces + agente de intención + poda del catálogo" : "Workspaces + intent agent + catalog pruning"}</td><td className="small muted">Uber QueryGPT</td><td className="small">{es ? "Router por workspace" : "Workspace router"}</td></tr>
              <tr><td>{es ? "Activos de confianza: consultas verificadas parametrizadas" : "Trusted assets: verified parameterised queries"}</td><td className="small muted">Databricks Genie</td><td className="small">{es ? "Nivel Verificado" : "Verified tier"}</td></tr>
              <tr><td>{es ? "Los benchmarks evalúan pero nunca alimentan el contexto" : "Benchmarks evaluate but never feed the context"}</td><td className="small muted">Databricks Genie</td><td className="small">{es ? "Test de disjunción en CI" : "Disjointness test in CI"}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <p className="footer-note">{es ? "Demo independiente con datos sintéticos. Código: github.com/gabebulacio/ai-analytics-demo" : "Independent demo with synthetic data. Code: github.com/gabebulacio/ai-analytics-demo"}</p>
    </div>
  );
}
