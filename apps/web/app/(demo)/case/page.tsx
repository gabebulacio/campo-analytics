"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useProof } from "@/lib/proof";

type T = { es: string; en: string };

const STATUS: { c: T; s: T; n: T }[] = [
  { c: { es: "Pipeline: router, planner, validador, compilador, ejecutor de solo lectura", en: "Pipeline: router, planner, validator, compiler, read-only executor" }, s: { es: "Real", en: "Real" }, n: { es: "Corre en esta demo, con un LLM real", en: "Runs in this demo, with a real LLM" } },
  { c: { es: "Evaluaciones por etapa, con gates en CI", en: "Per-stage evals, gated in CI" }, s: { es: "Real", en: "Real" }, n: { es: "Un cambio que baja la precisión no se mergea", en: "A change that lowers accuracy can't merge" } },
  { c: { es: "Capa semántica", en: "Semantic layer" }, s: { es: "Real", en: "Real" }, n: { es: "Un modelo propuesto; en un caso real se valida con quienes son dueños de cada métrica", en: "A proposed model; in a real setting it gets validated with each metric's owners" } },
  { c: { es: "Productores, lotes, Crop Stories, alertas", en: "Producers, fields, Crop Stories, alerts" }, s: { es: "Sintético", en: "Synthetic" }, n: { es: "Generados con semilla, ubicados en departamentos reales", en: "Seeded, placed in real departments" } },
  { c: { es: "Cambio de uso del suelo (EUDR)", en: "Land-use change (EUDR)" }, s: { es: "Simulado", en: "Simulated" }, n: { es: "El paso siguiente es JRC GFC2020 + MapBiomas", en: "Next step: JRC GFC2020 + MapBiomas" } },
  { c: { es: "Postgres/PostGIS y Mongo como fuentes", en: "Postgres/PostGIS and Mongo as sources" }, s: { es: "Parcial", en: "Partial" }, n: { es: "El ELT es SQL portable; acá corre sobre DuckDB", en: "The ELT is portable SQL; here it runs on DuckDB" } },
  { c: { es: "Login, multi-cliente, seguridad por fila", en: "Login, multi-tenant, row-level security" }, s: { es: "Pendiente", en: "Not built" }, n: { es: "Necesario antes de mostrarle algo a un cliente", en: "Needed before any client sees it" } },
];

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * 1000) / 10}%`);

export default function CaseStudy() {
  const { lang } = useI18n();
  const es = lang === "es";
  const l = lang;
  const p = useProof();

  return (
    <div className="page doc prose">
      <div>
        <p className="small muted">{es ? "Proyecto de portfolio · octubre 2026" : "Portfolio project · October 2026"}</p>
        <h1 style={{ marginTop: 4 }}>{es ? "Caso de estudio" : "Case study"}</h1>
      </div>

      <section>
        <h2>{es ? "Contexto" : "Context"}</h2>
        <p>
          {es
            ? "En las plataformas de trazabilidad agrícola, los tableros para clientes suelen armarse a mano en una herramienta de BI. Cada pedido nuevo es trabajo de BI, y la definición de cada número queda dentro de los datasets. Cuando el mismo lote-campaña se evalúa contra varios estándares (EUDR, ISCC, 45Z), las definiciones se separan con el tiempo."
            : "On agricultural traceability platforms, client dashboards are usually built by hand in a BI tool. Every new request means BI work, and each number's definition lives inside the datasets. When the same field-season is assessed against several standards (EUDR, ISCC, 45Z), definitions drift apart over time."}
        </p>
        <p>
          {es
            ? "Quería ver hasta dónde se puede llegar dejando que la gente pregunte directamente, sin perder la posibilidad de auditar cada número."
            : "I wanted to see how far you can get by letting people ask directly, without losing the ability to audit every number."}
        </p>
      </section>

      <section>
        <h2>{es ? "Qué construí" : "What I built"}</h2>
        <ul>
          <li>{es ? "Una capa semántica en YAML: métricas, dimensiones permitidas, joins declarados, diccionarios de valores y brechas conocidas." : "A semantic layer in YAML: metrics, allowed dimensions, declared joins, value dictionaries and known gaps."}</li>
          <li>{es ? "Un planner que no escribe SQL: devuelve un plan tipado (métricas, dimensiones, filtros). Si falta información, pregunta; si no hay métrica, lo dice." : "A planner that doesn't write SQL: it returns a typed plan (metrics, dimensions, filters). If information is missing it asks; if no metric fits it says so."}</li>
          <li>{es ? "Un validador y un compilador determinístico que convierten ese plan en SQL, ejecutado con un rol de solo lectura, timeout y tope de filas." : "A validator and a deterministic compiler that turn the plan into SQL, run under a read-only role with a timeout and a row cap."}</li>
          <li>{es ? "Consultas verificadas para las preguntas frecuentes, que se resuelven sin LLM." : "Verified queries for frequent questions, answered without an LLM."}</li>
          <li>{es ? "En cada respuesta: la definición de la métrica, el SQL, las tablas de origen y filas de muestra («¿Cómo se calculó?»)." : "On every answer: the metric definition, the SQL, the source tables and sample rows (“How was this calculated?”)."}</li>
        </ul>
      </section>

      <section>
        <h2>{es ? "Cómo lo pruebo" : "How it's tested"}</h2>
        <p>
          {es
            ? `Un set de ${p?.cases ?? 45} preguntas con el plan y el resultado esperados, que incluye preguntas ambiguas, fuera de alcance e intentos de inyección. Cada etapa se puntúa por separado y CI bloquea cambios que bajen la precisión. Última corrida:`
            : `A set of ${p?.cases ?? 45} questions with expected plans and results, including ambiguous, out-of-scope and injection cases. Each stage is scored separately and CI blocks changes that lower accuracy. Latest run:`}
        </p>
        <div className="panel">
          <table className="simple">
            <tbody>
              <tr><td>{es ? "Resultado correcto (preguntas respondibles)" : "Correct result (answerable questions)"}</td><td className="r num">{pct(p?.accuracy)}</td></tr>
              <tr><td>{es ? "Rechazos e inyecciones manejados bien" : "Refusals and injections handled correctly"}</td><td className="r num">{pct(p?.safety)}</td></tr>
              <tr><td>{es ? "Mediana de latencia (con LLM)" : "Median latency (with LLM)"}</td><td className="r num">{p?.p50 ? `${(p.p50 / 1000).toLocaleString(es ? "es-AR" : "en-US", { maximumFractionDigits: 1 })} s` : "–"}</td></tr>
              <tr><td>{es ? "Costo promedio por pregunta" : "Average cost per question"}</td><td className="r num">{p?.cost ? `US$ ${p.cost.toLocaleString(es ? "es-AR" : "en-US", { minimumFractionDigits: 4 })}` : "–"}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small muted"><Link href="/evals">{es ? "Ver el detalle por caso" : "See per-case detail"}</Link></p>
      </section>

      <section>
        <h2>{es ? "Qué es real y qué no" : "What's real and what isn't"}</h2>
        <div className="panel">
          <table className="simple">
            <tbody>
              {STATUS.map((r, i) => (
                <tr key={i}>
                  <td>{r.c[l]}</td>
                  <td style={{ whiteSpace: "nowrap" }}><b>{r.s[l]}</b></td>
                  <td className="muted">{r.n[l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>{es ? "La regla que seguí" : "The rule I followed"}</h2>
        <p>
          {es
            ? "Cuando una evaluación falla, el arreglo va primero a la capa semántica (una descripción, un sinónimo, una dimensión permitida, un mart nuevo), después a los ejemplos y recién al final al prompt. Los benchmarks públicos de dbt Labs y Cube apuntan a lo mismo: con una capa semántica, la precisión depende más del modelado que del modelo."
            : "When an eval fails, the fix goes to the semantic layer first (a description, a synonym, an allowed dimension, a new mart), then to the examples, and only last to the prompt. Public benchmarks from dbt Labs and Cube point the same way: with a semantic layer, accuracy depends more on the modeling than on the model."}
        </p>
        <p>
          {es ? "Cómo llevaría esto a un equipo real está en el " : "How I'd take this to a real team is in the "}
          <Link href="/plan">{es ? "plan de implementación" : "implementation plan"}</Link>.
        </p>
      </section>

      <p className="footer-note">
        {es ? "Demo independiente con datos sintéticos e información pública." : "Independent demo with synthetic data and public information."}{" "}
        <a href="https://github.com/gabebulacio/ai-analytics-demo">{es ? "Código en GitHub" : "Code on GitHub"}</a>
      </p>
    </div>
  );
}
