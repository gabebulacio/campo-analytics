"use client";

import { useEffect, useState } from "react";
import { CircleSlash, FlaskConical, Layers, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Lang } from "@/lib/types";
import { ArrowDefs, Box } from "@/components/DiagramBox";

type T = { he: string; en: string };
const tx = (o: T, l: Lang) => o[l];

function Diagram({ l }: { l: Lang }) {
  const he = l === "he";
  const stages: [string, string, string][] = [
    ["det", he ? "נרמול" : "Normalize", he ? "שפה · as_of\nהזרקה" : "language · as_of\ninjection"],
    ["ok", he ? "מאומת" : "Verified", he ? "שאילתות\nמהימנות · 0 AI" : "trusted queries\nno AI"],
    ["ai", "Router", "Haiku 5.5\nworkspace"],
    ["ai", "Planner", "Sonnet 5.5\nQueryPlan"],
    ["det", he ? "מאמת" : "Validator", he ? "קטלוג\nתיקון אחד" : "catalog\n1 repair"],
    ["det", he ? "מהדר" : "Compiler", he ? "תוכנית → SQL\njoins מוצהרים" : "plan → SQL\ndeclared joins"],
    ["det", he ? "מריץ" : "Executor", he ? "קריאה בלבד\n5 שנ׳ · 5,000 שורות" : "read-only\n5 s · 5,000 rows"],
    ["det", he ? "בדיקות" : "Checks", he ? "טווחים\nהתאמה" : "bounds\nreconciliation"],
  ];
  const sw = 104, gap = 14, x0 = 20, y0 = 196;
  return (
    <svg viewBox="0 0 1100 520" role="img" aria-label={he ? "תרשים ארכיטקטורה" : "Architecture diagram"}>
      <ArrowDefs />
      {/* row 1: user + web */}
      <Box x={20} y={20} w={200} h={74} cls="" title={he ? "משתמש עסקי" : "Business user"} sub={he ? "שאלה בעברית / באנגלית" : "question in ES / EN"} />
      <Box x={260} y={20} w={250} h={74} cls="" title="Web · Next.js (Vercel)" sub={he ? "תשובה + גרף + שושלת\nדשבורדים כ-specs של JSON" : "answer + chart + lineage\ndashboards as JSON specs"} />
      <Box x={550} y={20} w={250} h={74} cls="" title="API · FastAPI (Cloud Run)" sub={he ? "pipeline בשלבים\ntrace לכל שאלה" : "staged pipeline\none trace per question"} />
      <Box x={840} y={20} w={240} h={74} cls="ai" title="Claude API" sub={he ? "רק בוחר ומשלב\nאף פעם לא כותב SQL או מספרים" : "chooses and combines only\nnever writes SQL or numbers"} />
      <path className="arr" d="M220 57 H258" markerEnd="url(#ah)" />
      <path className="arr" d="M510 57 H548" markerEnd="url(#ah)" />
      <path className="arr" d="M800 57 H838" markerEnd="url(#ah)" />
      <text className="lbl" x={562} y={128}>{he ? "צינור התשובה" : "ANSWER PIPELINE"}</text>
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
      <Box x={x0 + 8 * (sw + gap)} y={y0} w={116} h={78} cls="ok" title={he ? "תשובה" : "Answer"} sub={he ? "רמת אמון\n+ שושלת" : "trust tier\n+ lineage"} />
      <path className="arr" d={`M${x0 + 8 * (sw + gap) - gap} ${y0 + 39} H${x0 + 8 * (sw + gap) - 2}`} markerEnd="url(#ah)" />
      {/* semantic layer */}
      <Box x={300} y={312} w={500} h={74} cls="det" title={he ? "שכבה סמנטית (YAML עם גרסאות)" : "Semantic layer (versioned YAML)"} sub={he ? "35 מדדים · ממדים · joins מוצהרים\nשאילתות מאומתות · ערכים · פערים ידועים" : "35 metrics · dimensions · declared joins\nverified queries · values · known gaps"} />
      <path className="arr" d="M420 312 V276" markerEnd="url(#ah)" />
      <path className="arr" d="M550 312 V276" markerEnd="url(#ah)" />
      <path className="arr" d="M680 312 V276" markerEnd="url(#ah)" />
      {/* data */}
      <Box x={20} y={420} w={240} h={78} cls="data" title="MongoDB (raw)" sub={he ? "Crop Story · גיאומטריות GeoJSON\nהתראות · טפסים" : "Crop Story · GeoJSON geometries\nalerts · forms"} />
      <Box x={300} y={420} w={240} h={78} cls="data" title="ELT" sub={he ? "raw → staging → marts\nבדיקות איכות נתונים" : "raw → staging → marts\ndata-quality tests"} />
      <Box x={580} y={420} w={240} h={78} cls="data" title={he ? "Postgres + PostGIS (marts)" : "Postgres + PostGIS (marts)"} sub={he ? "mart רחב אחד לכל תהליך\nתפקיד app_reader (SELECT בלבד)" : "one wide mart per process\napp_reader role (SELECT only)"} />
      <Box x={860} y={420} w={220} h={78} cls="ok" title={he ? "הערכות + traces" : "Evals + traces"} sub={he ? "סט זהב לפי שלב · CI\nreplay /trace/{id}" : "per-stage golden set · CI\n/trace/{id} replay"} />
      <path className="arr" d="M260 459 H298" markerEnd="url(#ah)" />
      <path className="arr" d="M540 459 H578" markerEnd="url(#ah)" />
      <path className="arr" d="M800 420 V276" markerEnd="url(#ah)" />
      <text className="lbl" x={812} y={404}>{he ? "SQL מהודר" : "compiled SQL"}</text>
    </svg>
  );
}

export default function Architecture() {
  const { lang } = useI18n();
  const l = lang;
  const he = l === "he";
  const [rep, setRep] = useState<any>(null);
  useEffect(() => {
    api.evals().then(setRep).catch(() => {});
  }, []);
  const pct = (v?: number | null) => (v === null || v === undefined ? "–" : `${(v * 100).toFixed(1)}%`);

  const principles: [T, T][] = [
    [{ he: "ה-AI בוחר ומשלב; הוא לא מחשב", en: "The AI chooses and combines; it doesn't calculate" }, { he: "המודל מחזיר QueryPlan מוקלד (מדדים, ממדים, מסננים). הוא אף פעם לא כותב SQL או מספרים.", en: "The model returns a typed QueryPlan (metrics, dimensions, filters). It never writes SQL or numbers." }],
    [{ he: "הלוגיקה יושבת בשכבה הסמנטית", en: "Logic lives in the semantic layer" }, { he: "יחסים של סכומים, הקטארים שנספרים פעם אחת, תקן חובה: כללים ב-YAML עם גרסאות, לא בפרומפטים.", en: "Ratio of sums, hectares counted once, required standard: rules in versioned YAML, not prompts." }],
    [{ he: "SQL דטרמיניסטי", en: "Deterministic SQL" }, { he: "אותה תוכנית ← אותו SQL, בייט אחר בייט. רק joins מוצהרים. בדיקות snapshot ב-CI.", en: "Same plan → same SQL, byte for byte. Declared joins only. Snapshot tests in CI." }],
    [{ he: "עדיף ״לא יודע״ מאשר מספר שגוי", en: "Better “I don't know” than a wrong number" }, { he: "אם חסר מדד, המערכת מסרבת ומציעה את הקרוב ביותר. הפערים הידועים מוצהרים.", en: "If a metric is missing, it refuses and offers the closest. Known gaps are declared." }],
    [{ he: "כל מספר ניתן למעקב", en: "Every number is traceable" }, { he: "הגדרה, תוכנית, SQL, טבלאות מקור, שורות לדוגמה, תאריך חיתוך וגרסה סמנטית.", en: "Definition, plan, SQL, source tables, sample rows, as-of date and semantic version." }],
    [{ he: "ההערכות הן חלק מהמוצר", en: "Evals are product" }, { he: "סט זהב שמנוקד לפי שלב; ה-CI חוסם אם הדיוק יורד. אף פעם לא משמש כ-few-shot.", en: "Golden set scored per stage; CI blocks if accuracy drops. Never used as few-shot." }],
  ];

  return (
    <div className="page doc">
      <div className="page-head">
        <div>
          <div className="eyebrow">{he ? "ארכיטקטורה" : "Architecture"}</div>
          <h1>{he ? "BI גנרטיבי מעל שכבה סמנטית מבוקרת" : "Generative BI over a governed semantic layer"}</h1>
          <p className="lead" style={{ marginTop: 8 }}>
            {he
              ? "משתמש שואל שאלה עסקית ומקבל דשבורד תוך שניות. ה-AI מפרש ובוחר; ההגדרות, ה-joins וה-SQL דטרמיניסטיים וניתנים לביקורת."
              : "A user asks a business question and gets a dashboard in seconds. The AI interprets and chooses; definitions, joins and SQL are deterministic and auditable."}
          </p>
        </div>
        <button className="btn no-print" onClick={() => window.print()}>{he ? "הדפסה / PDF" : "Print / PDF"}</button>
      </div>

      <p className="small muted show-mobile">{he ? "גללו את התרשים הצידה כדי לראות את כולו." : "Swipe the diagram sideways to see all of it."}</p>
      <div className="panel diagram">
        <Diagram l={l} />
        <div className="legend-row">
          <span><i style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }} />{he ? "AI (Claude)" : "AI (Claude)"}</span>
          <span><i style={{ borderColor: "var(--link)", background: "var(--link-soft)" }} />{he ? "דטרמיניסטי" : "Deterministic"}</span>
          <span><i style={{ borderColor: "var(--ok)", background: "var(--ok-soft)" }} />{he ? "אמון / בקרה" : "Trust / control"}</span>
          <span><i style={{ borderColor: "var(--line-strong)", background: "var(--surface-2)" }} />{he ? "נתונים" : "Data"}</span>
        </div>
      </div>

      {rep && (
        <section className="kpi-grid">
          {[
            [he ? "דיוק תוצאה" : "Result accuracy", pct(rep.scores.result_accuracy)],
            [he ? "סירובים נכונים" : "Refusal correctness", pct(rep.scores.refusal_correctness)],
            [he ? "עמידות להזרקה" : "Injection resistance", pct(rep.scores.injection_resistance)],
            [he ? "עלות ממוצעת לשאלה" : "Average cost per question", `US$ ${(rep.scores.cost_per_question_usd ?? 0).toFixed(4)}`],
          ].map(([k, v]) => (
            <div key={k} className="kpi-card" style={{ cursor: "default", minHeight: 0 }}>
              <span className="eyebrow">{k}</span>
              <span className="kpi-v">{v}</span>
              <span className="small faint">{he ? "סט זהב" : "Golden set"} · {rep.cases} {he ? "מקרים" : "cases"} · {rep.generated_at}</span>
            </div>
          ))}
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{he ? "עקרונות" : "Principles"}</h2>
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
        <h2>{he ? "רמות האמון של כל תשובה" : "Trust tier of every answer"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{he ? "רמה" : "Tier"}</th><th>{he ? "מתי" : "When"}</th><th>{he ? "מה המשתמש רואה" : "What the user sees"}</th></tr></thead>
            <tbody>
              <tr><td><span className="badge b-ok"><ShieldCheck size={13} />{he ? "מאומת" : "Verified"}</span></td><td>{he ? "תואמת שאילתה מאומתת; רק הפרמטרים מושלמים." : "Matches a verified query; only parameters are filled."}</td><td>{he ? "בעלים ותאריך אימות. עלות AI: 0." : "Owner and verification date. AI cost: 0."}</td></tr>
              <tr><td><span className="badge b-info"><Layers size={13} />{he ? "מבוקר" : "Governed"}</span></td><td>{he ? "QueryPlan על מדדים מוגדרים שעבר את כל האימותים." : "QueryPlan over defined metrics that passed every validator."}</td><td>{he ? "שושלת מלאה ואזהרות מהבדיקות." : "Full lineage and check warnings."}</td></tr>
              <tr><td><span className="badge b-warn"><FlaskConical size={13} />{he ? "חקרני" : "Exploratory"}</span></td><td>{he ? "SQL חופשי מאחורי דגל (כבוי בדמו הציבורי)." : "Free SQL behind a flag (off in the public demo)."}</td><td>{he ? "SQL פתוח ואזהרה לבדוק." : "SQL expanded and a review notice."}</td></tr>
              <tr><td><span className="badge b-none"><CircleSlash size={13} />{he ? "ללא תשובה" : "Not answered"}</span></td><td>{he ? "מחוץ לתחום, עמומה גם אחרי הבהרה, או שהאימות נכשל." : "Out of scope, ambiguous after one clarification, or failed validation."}</td><td>{he ? "הסבר פשוט והמדדים הקרובים ביותר." : "Plain explanation and the closest metrics."}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{he ? "סטאק" : "Stack"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{he ? "שכבה" : "Layer"}</th><th>{he ? "דמו" : "Demo"}</th><th>{he ? "פרודקשן" : "Production"}</th></tr></thead>
            <tbody>
              {[
                ["Web", "Next.js 15 · Recharts · Leaflet", "Vercel"],
                ["API", "FastAPI · Pydantic · sqlglot", "Cloud Run (min 0)"],
                [he ? "נתונים אנליטיים" : "Analytical data", "DuckDB (read-only)", "Postgres + PostGIS (Neon), app_reader"],
                [he ? "נתונים גולמיים" : "Raw data", "JSONL (Mongo-shaped)", "MongoDB Atlas"],
                ["LLM", "Claude Haiku 5.5 (router) · Sonnet 5.5 (planner)", he ? "אותו דבר; המודל נבחר לפי עלות בעזרת ההערכות" : "Same; model chosen on cost via evals"],
                ["CI", "GitHub Actions", he ? "Lint, בדיקות, linter סמנטי, הערכות עם gates" : "Lint, tests, semantic linter, gated evals"],
              ].map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? "" : "small"}>{i === 0 ? <b>{c}</b> : c}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{he ? "דפוסים ממערכות בפרודקשן" : "Patterns from production systems"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{he ? "דפוס" : "Pattern"}</th><th>{he ? "מקור" : "Source"}</th><th>{he ? "כאן" : "Here"}</th></tr></thead>
            <tbody>
              <tr><td>{he ? "ה-LLM מפרק למדדים + ממדים; מנוע מייצר את ה-SQL" : "LLM decomposes into metrics + dimensions; an engine writes SQL"}</td><td className="small muted">dbt Labs (2023, 2026)</td><td className="small">QueryPlan + {he ? "מהדר" : "compiler"}</td></tr>
              <tr><td>{he ? "הדיוק תלוי בשכבה הסמנטית יותר מאשר במודל" : "Accuracy depends on the semantic layer more than the model"}</td><td className="small muted">Cube (2026)</td><td className="small">{he ? "המודל כקונפיגורציה; מושווה בהערכות" : "Model as config; compared in evals"}</td></tr>
              <tr><td>{he ? "Workspaces + סוכן כוונה + גיזום הקטלוג" : "Workspaces + intent agent + catalog pruning"}</td><td className="small muted">Uber QueryGPT</td><td className="small">{he ? "Router לפי workspace" : "Workspace router"}</td></tr>
              <tr><td>{he ? "נכסים מהימנים: שאילתות מאומתות עם פרמטרים" : "Trusted assets: verified parameterised queries"}</td><td className="small muted">Databricks Genie</td><td className="small">{he ? "רמת ״מאומת״" : "Verified tier"}</td></tr>
              <tr><td>{he ? "הבנצ׳מרקים מעריכים, אבל אף פעם לא מוזנים להקשר" : "Benchmarks evaluate but never feed the context"}</td><td className="small muted">Databricks Genie</td><td className="small">{he ? "בדיקת הפרדה ב-CI" : "Disjointness test in CI"}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <p className="footer-note">{he ? "דמו עצמאי עם נתונים סינתטיים. קוד: " : "Independent demo with synthetic data. Code: "}<a href="https://github.com/gabebulacio/campo-analytics">github.com/gabebulacio/campo-analytics</a></p>
    </div>
  );
}
