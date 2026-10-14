"use client";

import Link from "next/link";
import { demoPath } from "@/lib/paths";
import { useI18n } from "@/lib/i18n";
import { useProof } from "@/lib/proof";

type T = { he: string; en: string };

const STATUS: { c: T; s: T; n: T }[] = [
  { c: { he: "Pipeline: router, planner, מאמת, מהדר, מריץ לקריאה בלבד", en: "Pipeline: router, planner, validator, compiler, read-only executor" }, s: { he: "אמיתי", en: "Real" }, n: { he: "רץ בדמו הזה, עם LLM אמיתי", en: "Runs in this demo, with a real LLM" } },
  { c: { he: "הערכות לפי שלב, עם gates ב-CI", en: "Per-stage evals, gated in CI" }, s: { he: "אמיתי", en: "Real" }, n: { he: "שינוי שמוריד את הדיוק לא נכנס ל-main", en: "A change that lowers accuracy can't merge" } },
  { c: { he: "שכבה סמנטית", en: "Semantic layer" }, s: { he: "אמיתי", en: "Real" }, n: { he: "מודל מוצע; במקרה אמיתי מאמתים אותו מול הבעלים של כל מדד", en: "A proposed model; in a real setting it gets validated with each metric's owners" } },
  { c: { he: "יצרנים, חלקות, Crop Stories, התראות", en: "Producers, fields, Crop Stories, alerts" }, s: { he: "סינתטי", en: "Synthetic" }, n: { he: "נוצרו עם seed, וממוקמים במחוזות אמיתיים", en: "Seeded, placed in real departments" } },
  { c: { he: "שינוי שימוש בקרקע (EUDR)", en: "Land-use change (EUDR)" }, s: { he: "מדומה", en: "Simulated" }, n: { he: "השלב הבא הוא JRC GFC2020 + MapBiomas", en: "Next step: JRC GFC2020 + MapBiomas" } },
  { c: { he: "MongoDB Atlas כמקור המסמכים", en: "MongoDB Atlas as the document source" }, s: { he: "אמיתי", en: "Real" }, n: { he: "ה-ELT שולף מ-Atlas, משטח ובונה את ה-marts", en: "The ELT extracts from Atlas, flattens and builds the marts" } },
  { c: { he: "Marts על Postgres/PostGIS", en: "Marts on Postgres/PostGIS" }, s: { he: "חלקי", en: "Partial" }, n: { he: "אותו SQL; היום ה-marts רצים על DuckDB", en: "Same SQL; the marts run on DuckDB today" } },
  { c: { he: "התחברות, ריבוי לקוחות, אבטחה ברמת שורה", en: "Login, multi-tenant, row-level security" }, s: { he: "בהמשך", en: "Not built" }, n: { he: "נדרש לפני שמראים משהו ללקוח", en: "Needed before any client sees it" } },
];

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * 1000) / 10}%`);

export default function CaseStudy() {
  const { lang } = useI18n();
  const he = lang === "he";
  const l = lang;
  const p = useProof();

  return (
    <div className="page doc prose">
      <div>
        <p className="small muted">{he ? "פרויקט פורטפוליו · אוקטובר 2026" : "Portfolio project · October 2026"}</p>
        <h1 style={{ marginTop: 4 }}>{he ? "מקרה בוחן" : "Case study"}</h1>
      </div>

      <section>
        <h2>{he ? "רקע" : "Context"}</h2>
        <p>
          {he
            ? "בפלטפורמות של עקיבות חקלאית, דשבורדים ללקוחות נבנים בדרך כלל ידנית בכלי BI. כל בקשה חדשה היא עבודת BI, וההגדרה של כל מספר נשארת בתוך ה-datasets. כשאותה חלקה-עונה נבדקת מול כמה תקנים (EUDR, ISCC, 45Z), ההגדרות מתרחקות זו מזו עם הזמן."
            : "On agricultural traceability platforms, client dashboards are usually built by hand in a BI tool. Every new request means BI work, and each number's definition lives inside the datasets. When the same field-season is assessed against several standards (EUDR, ISCC, 45Z), definitions drift apart over time."}
        </p>
        <p>
          {he
            ? "רציתי לבדוק כמה רחוק אפשר להגיע כשנותנים לאנשים לשאול ישירות, בלי לוותר על היכולת לבקר כל מספר."
            : "I wanted to see how far you can get by letting people ask directly, without losing the ability to audit every number."}
        </p>
      </section>

      <section>
        <h2>{he ? "מה בניתי" : "What I built"}</h2>
        <ul>
          <li>{he ? "שכבה סמנטית ב-YAML: מדדים, ממדים מותרים, joins מוצהרים, מילוני ערכים ופערים ידועים." : "A semantic layer in YAML: metrics, allowed dimensions, declared joins, value dictionaries and known gaps."}</li>
          <li>{he ? "Planner שלא כותב SQL: הוא מחזיר תוכנית מוקלדת (מדדים, ממדים, מסננים). אם חסר מידע, הוא שואל; אם אין מדד, הוא אומר את זה." : "A planner that doesn't write SQL: it returns a typed plan (metrics, dimensions, filters). If information is missing it asks; if no metric fits it says so."}</li>
          <li>{he ? "מאמת ומהדר דטרמיניסטי שהופכים את התוכנית ל-SQL, שרץ עם תפקיד לקריאה בלבד, timeout ומגבלת שורות." : "A validator and a deterministic compiler that turn the plan into SQL, run under a read-only role with a timeout and a row cap."}</li>
          <li>{he ? "שאילתות מאומתות לשאלות הנפוצות, שנענות בלי LLM." : "Verified queries for frequent questions, answered without an LLM."}</li>
          <li>{he ? "בכל תשובה: הגדרת המדד, ה-SQL, טבלאות המקור ושורות לדוגמה (״איך זה חושב?״)." : "On every answer: the metric definition, the SQL, the source tables and sample rows (“How was this calculated?”)."}</li>
        </ul>
      </section>

      <section>
        <h2>{he ? "איך אני בודק את זה" : "How it's tested"}</h2>
        <p>
          {he
            ? `סט של ${p?.cases ?? 45} שאלות עם התוכנית והתוצאה הצפויות, כולל שאלות עמומות, שאלות מחוץ לתחום וניסיונות הזרקה. כל שלב מנוקד בנפרד, וה-CI חוסם שינויים שמורידים את הדיוק. הריצה האחרונה:`
            : `A set of ${p?.cases ?? 45} questions with expected plans and results, including ambiguous, out-of-scope and injection cases. Each stage is scored separately and CI blocks changes that lower accuracy. Latest run:`}
        </p>
        <div className="panel">
          <table className="simple">
            <tbody>
              <tr><td>{he ? "תוצאה נכונה (שאלות שאפשר לענות עליהן)" : "Correct result (answerable questions)"}</td><td className="r num">{pct(p?.accuracy)}</td></tr>
              <tr><td>{he ? "סירובים והזרקות שטופלו נכון" : "Refusals and injections handled correctly"}</td><td className="r num">{pct(p?.safety)}</td></tr>
              <tr><td>{he ? "זמן תגובה חציוני (עם LLM)" : "Median latency (with LLM)"}</td><td className="r num">{p?.p50 ? `${(p.p50 / 1000).toLocaleString(he ? "he-IL" : "en-US", { maximumFractionDigits: 1 })} s` : "–"}</td></tr>
              <tr><td>{he ? "עלות ממוצעת לשאלה" : "Average cost per question"}</td><td className="r num">{p?.cost ? `US$ ${p.cost.toLocaleString(he ? "he-IL" : "en-US", { minimumFractionDigits: 4 })}` : "–"}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="small muted"><Link href={demoPath("/evals")}>{he ? "לפירוט לפי מקרה" : "See per-case detail"}</Link></p>
      </section>

      <section>
        <h2>{he ? "מה אמיתי ומה לא" : "What's real and what isn't"}</h2>
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
        <h2>{he ? "הכלל שעבדתי לפיו" : "The rule I followed"}</h2>
        <p>
          {he
            ? "כשהערכה נכשלת, התיקון הולך קודם לשכבה הסמנטית (תיאור, מילה נרדפת, ממד מותר, mart חדש), אחר כך לדוגמאות, ורק בסוף לפרומפט. הבנצ׳מרקים הציבוריים של dbt Labs ו-Cube מצביעים על אותו דבר: עם שכבה סמנטית, הדיוק תלוי יותר במידול מאשר במודל."
            : "When an eval fails, the fix goes to the semantic layer first (a description, a synonym, an allowed dimension, a new mart), then to the examples, and only last to the prompt. Public benchmarks from dbt Labs and Cube point the same way: with a semantic layer, accuracy depends more on the modeling than on the model."}
        </p>
        <p>
          {he ? "איך הייתי מביא את זה לצוות אמיתי מפורט ב" : "How I'd take this to a real team is in the "}
          <Link href={demoPath("/plan")}>{he ? "תוכנית היישום" : "implementation plan"}</Link>.
        </p>
      </section>

      <p className="footer-note">
        {he ? "דמו עצמאי עם נתונים סינתטיים ומידע ציבורי." : "Independent demo with synthetic data and public information."}{" "}
        <a href="https://github.com/gabebulacio/campo-analytics">{he ? "הקוד ב-GitHub" : "Code on GitHub"}</a>
      </p>
    </div>
  );
}
