"use client";

import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type T = { he: string; en: string };

const PHASES: { when: T; title: T; goal: T; items: T[]; gate: T }[] = [
  {
    when: { he: "ימים 1–30", en: "Days 1–30" },
    title: { he: "להבין ולהסכים", en: "Understand and agree" },
    goal: { he: "לפני שכותבים קוד: לדעת אילו דשבורדים חשובים ומה המשמעות של כל מספר.", en: "Before writing code: know which dashboards matter and what each number means." },
    items: [
      { he: "מיפוי הדשבורדים ב-QuickSight ושל 5 הדשבורדים שהלקוחות משתמשים בהם הכי הרבה.", en: "Inventory of QuickSight dashboards and the 5 clients use most." },
      { he: "מילון מדדים לפי תקן: מה בדיוק זה ״הקטאר מאומת״ ב-EUDR, ISCC, 45Z…", en: "Metric glossary per standard: what exactly “verified hectare” means for EUDR, ISCC, 45Z…" },
      { he: "מיפוי שדה ב-QuickSight ← מדד סמנטי, עם סימון של חישובים שהיום ממצעים יחסים.", en: "Map QuickSight field → semantic metric, flagging calcs that average ratios today." },
      { he: "סקר נתונים: מה נמצא ב-Mongo ומה ב-Postgres, עדכניות ופערים.", en: "Data survey: what lives in Mongo vs Postgres, freshness and gaps." },
      { he: "סט זהב ראשוני עם 50+ שאלות אמיתיות (מתמיכה, ממכירות ומלקוחות) עם התשובה הצפויה.", en: "Initial golden set of 50+ real questions (support, sales, clients) with expected answers." },
      { he: "workspace ראשון: ציות ל-EUDR (החובות חלות מ-30/12/2026).", en: "First workspace: EUDR compliance (obligations apply from 30 Dec 2026)." },
    ],
    gate: { he: "מילון חתום על ידי BI ומוצר. בלי מדדים מוסכמים לא בונים.", en: "Glossary signed off by BI and product. No agreed metrics, no build." },
  },
  {
    when: { he: "ימים 31–60", en: "Days 31–60" },
    title: { he: "לבנות את השכבה עם הערכות", en: "Build the layer, with evals" },
    goal: { he: "השכבה הסמנטית, המהדר וההערכות על הנתונים האמיתיים, בלי לגעת במה שכבר עובד.", en: "Semantic layer, compiler and evals on real data, without touching what already works." },
    items: [
      { he: "שכבה סמנטית עם גרסאות בריפו + linter ב-CI (הפניות, joins לא מוצהרים, מילים נרדפות).", en: "Versioned semantic layer in the repo + linter in CI (references, undeclared joins, synonyms)." },
      { he: "Marts רחבים לכל תהליך (חלקה-עונה, הערכת שינוי שימוש בקרקע, אצוות מוצר) על Postgres/PostGIS.", en: "Wide marts per process (field-season, land-use assessment, product lots) on Postgres/PostGIS." },
      { he: "מהדר דטרמיניסטי ותפקיד לקריאה בלבד ברמת מסד הנתונים.", en: "Deterministic compiler and a database-level read-only role." },
      { he: "8–12 שאילתות מאומתות לשאלות הנפוצות ביותר.", en: "8–12 verified queries for the most frequent questions." },
      { he: "הערכות לפי שלב ב-CI; פיילוט פנימי עם צוות ה-BI.", en: "Per-stage evals in CI; internal pilot with the BI team." },
    ],
    gate: { he: "דיוק של 95% ומעלה בסט הזהב, 100% בסירובים ובהזרקות, ואפס הבדלים מול QuickSight ב-5 הדשבורדים המרכזיים.", en: "≥ 95% accuracy on the golden set, 100% on refusals and injection, and zero differences vs QuickSight on the 5 key dashboards." },
  },
  {
    when: { he: "ימים 61–90", en: "Days 61–90" },
    title: { he: "להעביר ולהריץ פיילוט עם לקוחות", en: "Migrate and pilot with clients" },
    goal: { he: "הדשבורדים החדשים רצים לצד QuickSight עד שהמספרים תואמים.", en: "New dashboards run alongside QuickSight until the numbers match." },
    items: [
      { he: "לבנות מחדש את 5 הדשבורדים המרכזיים כ-specs (שאלות + תוכניות), עם QuickSight במקביל.", en: "Rebuild the 5 key dashboards as specs (questions + plans), with QuickSight in parallel." },
      { he: "פיילוט עם 1–2 לקוחות על דשבורדים של ציות ל-EUDR.", en: "Pilot with 1–2 clients on EUDR compliance dashboards." },
      { he: "לולאת משוב: כל דירוג שלילי נבדק ויכול להיכנס לסט הזהב.", en: "Feedback loop: every thumbs-down is reviewed and can be promoted to the golden set." },
      { he: "ניטור עלות, זמני תגובה ושאלות ללא תשובה (שמכוונות את המידול הבא).", en: "Monitoring of cost, latency and unanswered questions (which drive the next modeling)." },
    ],
    gate: { he: "אישור הפיילוט ודוח התאמה. רק אז מכבים את הדשבורד הישן המקביל.", en: "Pilot sign-off and a parity report. Only then is the matching old dashboard switched off." },
  },
];

const RISKS: [T, T][] = [
  [{ he: "הגדרות שונות בין מחלקות", en: "Different definitions across teams" }, { he: "נפתר בשלב 1 עם המילון החתום, לפני שכותבים קוד.", en: "Resolved in phase 1 with the signed glossary, before writing code." }],
  [{ he: "הפיתוי לתת ל-AI לכתוב SQL חופשי כדי להתקדם מהר יותר", en: "Temptation to let the AI write free SQL to go faster" }, { he: "מהדר דטרמיניסטי; SQL חופשי רק כמצב חקרני מתויג, וכבוי כברירת מחדל.", en: "Deterministic compiler; free SQL only as a labeled exploratory mode, off by default." }],
  [{ he: "Joins של כמה קפיצות (הסיבה העיקרית לטעויות)", en: "Multi-hop joins (the main failure mode)" }, { he: "מתקנים אותם במידול (marts רחבים), לא בפרומפטים. Join לא מוצהר = סירוב + רישום פער.", en: "Fixed with modeling (wide marts), not prompts. Undeclared join = refusal + gap logged." }],
  [{ he: "עלות LLM", en: "LLM cost" }, { he: "שאילתות מאומתות בלי LLM, מטמון, מודל זול לניתוב. נמדד היום: בממוצע כ-$0.003 לשאלה.", en: "Verified queries without LLM, caching, a cheap routing model. Measured today: ~US$ 0.003 per question on average." }],
  [{ he: "אמון הלקוח במספרים שנוצרו אוטומטית", en: "Client trust in generated numbers" }, { he: "רמת אמון גלויה, שושלת מלאה ואזהרות מהבדיקות בכל תשובה.", en: "Visible trust tier, full lineage and check warnings on every answer." }],
];

export default function Plan() {
  const { lang } = useI18n();
  const l = lang;
  const he = l === "he";
  return (
    <div className="page doc">
      <div className="page-head">
        <div>
          <div className="eyebrow">{he ? "הצעה" : "Proposal"}</div>
          <h1>{he ? "מ-QuickSight לדשבורדים שנוצרים עם AI, תוך 90 יום" : "From QuickSight to AI-generated dashboards, in 90 days"}</h1>
          <p className="lead" style={{ marginTop: 8 }}>
            {he
              ? "קודם להבין ולהסכים על המדדים; אחר כך לבנות את השכבה עם הערכות; ורק בסוף להעביר, עם QuickSight במקביל. שום דבר לא נכבה עד שהדשבורד החדש נותן את אותם מספרים."
              : "First understand and agree on metrics; then build the layer with evals; only then migrate, with QuickSight in parallel. Nothing is switched off until the new dashboard gives the same numbers."}
          </p>
        </div>
        <button className="btn no-print" onClick={() => window.print()}>{he ? "הדפסה / PDF" : "Print / PDF"}</button>
      </div>

      <div className="panel" style={{ padding: "4px 20px" }}>
        <div className="timeline">
          {PHASES.map((p, i) => (
            <div key={i} className="phase">
              <div className="when">
                <span className="eyebrow">{he ? "שלב" : "Phase"} {i + 1}</span>
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
        <h2>{he ? "איך מודדים הצלחה אחרי 90 יום" : "How success is measured at 90 days"}</h2>
        <div className="kpi-grid">
          {[
            [he ? "זמן עד דשבורד חדש" : "Time to a new dashboard", he ? "ימים ← דקות" : "days → minutes"],
            [he ? "דיוק בסט הזהב" : "Golden-set accuracy", "≥ 95 %"],
            [he ? "שאלות שנענו עם מדדים מבוקרים" : "Questions answered with governed metrics", "≥ 80 %"],
            [he ? "הבדלים מול QuickSight (5 המרכזיים)" : "Differences vs QuickSight (top 5)", "0"],
          ].map(([k, v]) => (
            <div key={k} className="kpi-card" style={{ cursor: "default", minHeight: 0 }}>
              <span className="eyebrow">{k}</span>
              <span className="kpi-v">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>{he ? "סיכונים ואיך אני מטפל בהם" : "Risks and how I handle them"}</h2>
        <div className="panel">
          <table className="simple">
            <thead><tr><th>{he ? "סיכון" : "Risk"}</th><th>{he ? "דרך התמודדות" : "Mitigation"}</th></tr></thead>
            <tbody>{RISKS.map(([r, m], i) => <tr key={i}><td><b>{r[l]}</b></td><td>{m[l]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel card">
          <h3>{he ? "מה אני מספק" : "What I deliver"}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>{he ? "מילון מדדים ומיפוי QuickSight ← שכבה סמנטית" : "Metric glossary and QuickSight → semantic layer map"}</li>
            <li>{he ? "שכבה סמנטית + מהדר + תפקיד לקריאה בלבד" : "Semantic layer + compiler + read-only role"}</li>
            <li>{he ? "סט זהב והערכות ב-CI עם gates" : "Golden set and gated evals in CI"}</li>
            <li>{he ? "5 דשבורדים מרכזיים שהועברו, עם דוח התאמה" : "5 key dashboards migrated, with a parity report"}</li>
            <li>{he ? "פאנל של traces, עלות ושאלות ללא תשובה" : "Traces, cost and unanswered-questions panel"}</li>
          </ul>
        </div>
        <div className="panel card">
          <h3>{he ? "מה אני צריך מהצוות" : "What I need from the team"}</h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>{he ? "הרשאת קריאה ל-Mongo, ל-Postgres ול-datasets של QuickSight" : "Read access to Mongo, Postgres and the QuickSight datasets"}</li>
            <li>{he ? "איש קשר ממוצר/ציות לכל תקן, בשביל המילון" : "A product/compliance owner per standard for the glossary"}</li>
            <li>{he ? "שאלות אמיתיות מלקוחות ומהתמיכה בשביל סט הזהב" : "Real client and support questions for the golden set"}</li>
            <li>{he ? "1–2 לקוחות שמוכנים לפיילוט" : "1–2 clients willing to pilot"}</li>
            <li>{he ? "להגדיר ספק LLM ומגבלות עלות/פרטיות" : "Agree on the LLM provider and cost/privacy constraints"}</li>
          </ul>
        </div>
      </section>
      <p className="footer-note">{he ? "הצעה עצמאית שמבוססת על מידע ציבורי. הדמו משתמש בנתונים סינתטיים." : "Independent proposal based on public information. The demo uses synthetic data."}</p>
    </div>
  );
}
