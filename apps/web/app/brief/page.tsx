"use client";

import Link from "next/link";
import { ArrowRight, FileSearch, Layers, PlayCircle, Printer, ShieldCheck, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { proofItems, useProof } from "@/components/ProofStrip";

type T = { es: string; en: string };

const PROBLEMS: { t: T; d: T }[] = [
  {
    t: { es: "Cada tablero nuevo es trabajo manual", en: "Every new dashboard is manual work" },
    d: { es: "Un pedido de cliente son días de BI, y la lógica de cada número queda repartida entre datasets.", en: "A client request means days of BI work, and each number's logic ends up spread across datasets." },
  },
  {
    t: { es: "Un mismo dato, varios estándares", en: "One dataset, many standards" },
    d: { es: "El mismo lote-campaña responde a EUDR, ISCC y 45Z con reglas distintas. Sin definiciones únicas, los números divergen.", en: "The same field-season answers to EUDR, ISCC and 45Z under different rules. Without single definitions, numbers drift." },
  },
  {
    t: { es: "EUDR no espera", en: "EUDR won't wait" },
    d: { es: "Las obligaciones para operadores grandes y medianos aplican desde el 30/12/2026. Los clientes necesitan vistas de cumplimiento ahora.", en: "Obligations for large and medium operators apply from 30 Dec 2026. Clients need compliance views now." },
  },
];

const STATUS: { c: T; s: "ok" | "sim" | "next"; n: T }[] = [
  { c: { es: "Pipeline: router, planner, validador, compilador, ejecutor de solo lectura", en: "Pipeline: router, planner, validator, compiler, read-only executor" }, s: "ok", n: { es: "Corriendo en esta demo, con IA real", en: "Running in this demo, with a real LLM" } },
  { c: { es: "Evaluaciones por etapa con gates en CI", en: "Per-stage evals with CI gates" }, s: "ok", n: { es: "Un cambio que baja la precisión no se mergea", en: "A change that lowers accuracy can't merge" } },
  { c: { es: "Capa semántica (métricas, dimensiones, joins declarados)", en: "Semantic layer (metrics, dimensions, declared joins)" }, s: "ok", n: { es: "Modelo propuesto: se valida con el equipo en la fase 1", en: "Proposed model: validated with the team in phase 1" } },
  { c: { es: "Productores, lotes, Crop Stories, alertas", en: "Producers, fields, Crop Stories, alerts" }, s: "sim", n: { es: "Sintéticos y con semilla, ubicados en departamentos reales", en: "Synthetic and seeded, placed in real departments" } },
  { c: { es: "Cambio de uso del suelo (EUDR)", en: "Land-use change (EUDR)" }, s: "sim", n: { es: "Simulado; siguiente paso: JRC GFC2020 + MapBiomas", en: "Simulated; next: JRC GFC2020 + MapBiomas" } },
  { c: { es: "Postgres/PostGIS + Mongo como fuentes", en: "Postgres/PostGIS + Mongo as sources" }, s: "next", n: { es: "El ELT ya es SQL portable; la demo usa DuckDB con el mismo SQL", en: "ELT is already portable SQL; the demo runs it on DuckDB" } },
  { c: { es: "Login, multi-cliente y seguridad por fila", en: "Login, multi-tenant and row-level security" }, s: "next", n: { es: "Fase de endurecimiento, antes de cualquier piloto con clientes", en: "Hardening phase, before any client pilot" } },
];

export default function Brief() {
  const { lang } = useI18n();
  const es = lang === "es";
  const l = lang;
  const proof = useProof();
  const items = proof ? proofItems(proof, lang) : null;

  const pillars = [
    { icon: <ShieldCheck size={16} />, k: es ? "Confiable" : "Reliable", v: items?.[1][0] ?? "…", d: es ? `de precisión en ${proof?.cases ?? "…"} preguntas doradas, puntuadas etapa por etapa.` : `accuracy on ${proof?.cases ?? "…"} golden questions, scored stage by stage.` },
    { icon: <Layers size={16} />, k: es ? "Seguro" : "Safe", v: items?.[2][0] ?? "…", d: es ? "de rechazos correctos e inyecciones bloqueadas. Si no sabe, lo dice." : "correct refusals and blocked injections. If it doesn't know, it says so." },
    { icon: <FileSearch size={16} />, k: es ? "Trazable" : "Traceable", v: items?.[0][0] ?? "…", d: es ? "métricas gobernadas. Cada número lleva su definición, SQL y filas de origen." : "governed metrics. Every number carries its definition, SQL and source rows." },
    { icon: <Wallet size={16} />, k: es ? "Económico" : "Cheap to run", v: items?.[4][0] ?? "…", d: es ? `por pregunta; mediana ${items?.[3][0] ?? "…"}. Las verificadas no usan IA y responden en < 1 s.` : `per question; median ${items?.[3][0] ?? "…"}. Verified answers skip the AI and return in < 1 s.` },
  ];

  return (
    <div className="page doc">
      <section className="panel brief-hero">
        <div className="eyebrow">{es ? "Resumen ejecutivo · MVP" : "Executive brief · MVP"}</div>
        <h1>{es ? "Tableros que se arman con una pregunta, y números que se pueden auditar" : "Dashboards built from a question, with numbers you can audit"}</h1>
        <p className="lead">
          {es
            ? "La IA interpreta la pregunta y elige métricas que ya están definidas. Un compilador determinístico escribe el SQL. Cada respuesta muestra su nivel de confianza y su linaje completo, y un set de evaluaciones prueba que funciona."
            : "The AI interprets the question and picks metrics that are already defined. A deterministic compiler writes the SQL. Every answer shows its trust tier and full lineage, and an eval suite proves it works."}
        </p>
        <div className="byline">
          <span>Gabriel Bulacio · Analytics Engineer</span>
          <span>{es ? "Octubre 2026" : "October 2026"}</span>
          <span>{es ? "Datos sintéticos" : "Synthetic data"}</span>
        </div>
        <div className="cta-row no-print">
          <Link className="btn primary" href="/"><PlayCircle size={14} /> {es ? "Ver el recorrido de 5 min" : "Take the 5-min tour"}</Link>
          <Link className="btn" href="/plan">{es ? "Plan de 90 días" : "90-day plan"} <ArrowRight size={14} /></Link>
          <Link className="btn" href="/architecture">{es ? "Arquitectura" : "Architecture"} <ArrowRight size={14} /></Link>
          <button className="btn" onClick={() => window.print()}><Printer size={14} /> PDF</button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="eyebrow">{es ? "El problema" : "The problem"}</div>
        <div className="cards-3">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="panel card-n">
              <span className="n">0{i + 1}</span>
              <h3>{p.t[l]}</h3>
              <p className="muted">{p.d[l]}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="section-head">
          <div>
            <div className="eyebrow">{es ? "Qué demuestra el MVP" : "What the MVP proves"}</div>
            <h2>{es ? "Medido, no prometido" : "Measured, not promised"}</h2>
          </div>
          <Link href="/evals" className="small">{es ? "Ver el reporte completo" : "See the full report"} →</Link>
        </div>
        <div className="pillars">
          {pillars.map((p) => (
            <div key={p.k} className="panel pillar">
              <span className="pk">{p.icon}{p.k}</span>
              <span className="pv num">{p.v}</span>
              <span className="small muted">{p.d}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel card" style={{ gap: 10 }}>
        <div className="eyebrow">{es ? "El principio de diseño" : "The design principle"}</div>
        <h2 style={{ maxWidth: "60ch" }}>
          {es ? "La lógica de negocio vive en la capa semántica, no en el prompt." : "Business logic lives in the semantic layer, not in the prompt."}
        </h2>
        <div className="flow">
          <span>{es ? "pregunta" : "question"}</span>→<span>{es ? "router (IA)" : "router (AI)"}</span>→<span>{es ? "plan tipado (IA)" : "typed plan (AI)"}</span>→<span>{es ? "validador" : "validator"}</span>→<span>{es ? "compilador → SQL" : "compiler → SQL"}</span>→<span>{es ? "solo lectura" : "read-only"}</span>→<span>{es ? "chequeos + linaje" : "checks + lineage"}</span>
        </div>
        <p className="muted small" style={{ maxWidth: "80ch" }}>
          {es
            ? "Los benchmarks públicos (dbt Labs, Cube) coinciden: con una capa semántica, la precisión depende del modelado más que del modelo. Por eso el esfuerzo va a las definiciones y a las evaluaciones, y el modelo de IA se elige por costo."
            : "Public benchmarks (dbt Labs, Cube) agree: with a semantic layer, accuracy depends on the modeling more than on the model. So the effort goes into definitions and evals, and the AI model is chosen on cost."}
        </p>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="eyebrow">{es ? "Transparencia" : "Transparency"}</div>
        <h2>{es ? "Qué es real y qué es simulado" : "What's real and what's simulated"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{es ? "Componente" : "Component"}</th><th>{es ? "Estado" : "Status"}</th><th>{es ? "Nota" : "Note"}</th></tr></thead>
            <tbody>
              {STATUS.map((r, i) => (
                <tr key={i}>
                  <td><b>{r.c[l]}</b></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <span className={`status-${r.s}`}>{r.s === "ok" ? (es ? "● Real" : "● Real") : r.s === "sim" ? (es ? "◐ Simulado" : "◐ Simulated") : (es ? "○ Próximo" : "○ Next")}</span>
                  </td>
                  <td className="muted">{r.n[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="eyebrow">{es ? "Próximos pasos" : "Next steps"}</div>
        <div className="cards-3">
          {[
            [es ? "Semanas 1–2" : "Weeks 1–2", es ? "Glosario de métricas" : "Metric glossary", es ? "Qué es exactamente una «hectárea verificada» para cada estándar, firmado por BI y producto." : "What exactly a “verified hectare” is for each standard, signed off by BI and product."],
            [es ? "Días 31–60" : "Days 31–60", es ? "Capa sobre datos reales" : "Layer on real data", es ? "Réplica de lectura de Postgres/Mongo, set dorado con preguntas reales y paridad contra los 5 tableros clave." : "Postgres/Mongo read replica, a golden set of real questions, and parity against the 5 key dashboards."],
            [es ? "Días 61–90" : "Days 61–90", es ? "Piloto EUDR" : "EUDR pilot", es ? "1–2 clientes con tableros de cumplimiento generados, conviviendo con los actuales hasta que los números coincidan." : "1–2 clients on generated compliance dashboards, alongside the current ones until the numbers match."],
          ].map(([w, t, d]) => (
            <div key={t} className="panel card-n">
              <span className="n">{w}</span>
              <h3>{t}</h3>
              <p className="muted">{d}</p>
            </div>
          ))}
        </div>
        <div className="no-print"><Link className="btn" href="/plan">{es ? "Ver el plan completo, con gates y riesgos" : "See the full plan, with gates and risks"} <ArrowRight size={14} /></Link></div>
      </section>

      <p className="footer-note">
        {es
          ? "Demo independiente, construida con información pública y datos sintéticos. No usa datos, nombre ni marca de ninguna empresa."
          : "Independent demo, built from public information and synthetic data. It uses no company's data, name or brand."}
      </p>
    </div>
  );
}
