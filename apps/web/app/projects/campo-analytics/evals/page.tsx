"use client";

import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${(v * 100).toFixed(1)}%`);

export default function Evals() {
  const { lang } = useI18n();
  const [rep, setRep] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.evals().then(setRep).catch(() => setErr(true));
  }, []);

  if (err)
    return (
      <div className="page">
        <div className="panel empty">
          <FlaskConical size={24} />
          <b>{lang === "he" ? "עדיין אין דוח הערכה." : "No eval report yet."}</b>
          <span className="mono small">python tasks.py evals</span>
        </div>
      </div>
    );
  if (!rep) return <div className="page"><div className="bar" /></div>;
  const s = rep.scores;
  const gates = rep.gates || [];
  const cards: [string, string, number | null][] = [
    ["result_accuracy", lang === "he" ? "דיוק תוצאה (שאפשר לענות עליהן)" : "Result accuracy (answerable)", s.result_accuracy],
    ["routing_accuracy", lang === "he" ? "ניתוב (workspace + כוונה)" : "Routing (workspace + intent)", s.routing_accuracy],
    ["verified_match_precision", lang === "he" ? "דיוק התאמה מאומתת" : "Verified-match precision", s.verified_match_precision],
    ["plan_exact", lang === "he" ? "התאמת תוכנית מדויקת" : "Plan exact match", s.plan_exact],
    ["refusal_correctness", lang === "he" ? "סירובים נכונים" : "Refusal correctness", s.refusal_correctness],
    ["clarification_appropriateness", lang === "he" ? "הבהרות במקום" : "Clarification appropriateness", s.clarification_appropriateness],
    ["injection_resistance", lang === "he" ? "עמידות להזרקה" : "Injection resistance", s.injection_resistance],
    ["consistency", lang === "he" ? "עקביות (אותה תוכנית ב-3 ריצות)" : "Consistency (same plan over runs)", s.consistency],
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{lang === "he" ? "סט זהב" : "Golden set"} · {rep.cases} {lang === "he" ? "מקרים" : "cases"} · {rep.runs_per_case}× · {rep.generated_at}</div>
          <h1>{lang === "he" ? "הערכות לפי שלב" : "Per-stage evaluation"}</h1>
          <p className="lede">{lang === "he" ? "כל שלב מנוקד בנפרד. סט הזהב אף פעם לא משמש כדוגמה בפרומפט (בדיקה אוטומטית מבטיחה את זה)." : "Each stage is scored separately. The golden set is never used as prompt examples (a test enforces it)."}</p>
        </div>
      </div>
      <div className="score">
        {cards.map(([k, l, v]) => (
          <div key={k} className="kpi">
            <span className="eyebrow">{l}</span>
            <span className="v">{pct(v)}</span>
          </div>
        ))}
        <div className="kpi"><span className="eyebrow">Latency p50 / p95</span><span className="v">{s.latency_p50_ms ?? "–"} / {s.latency_p95_ms ?? "–"} ms</span></div>
        <div className="kpi"><span className="eyebrow">{lang === "he" ? "עלות לשאלה" : "Cost per question"}</span><span className="v">US$ {(s.cost_per_question_usd ?? 0).toFixed(4)}</span></div>
      </div>
      {gates.length > 0 && (
        <div className="panel card">
          <h3>CI gates</h3>
          {gates.map((g: any) => (
            <div key={g.name} className="small"><span className={g.pass ? "pill-ok" : "pill-bad"}>{g.pass ? "PASS" : "FAIL"}</span> · {g.name}: {pct(g.value)} (≥ {pct(g.threshold)})</div>
          ))}
        </div>
      )}
      {rep.model_comparison && (
        <div className="panel card">
          <h3>{lang === "he" ? "השוואת מודלים" : "Model comparison"}</h3>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Model</th><th className="r">Result acc.</th><th className="r">Plan exact</th><th className="r">p50 ms</th><th className="r">US$/q</th></tr></thead>
              <tbody>
                {rep.model_comparison.map((m: any) => (
                  <tr key={m.model}><td className="mono">{m.model}</td><td className="r">{pct(m.result_accuracy)}</td><td className="r">{pct(m.plan_exact)}</td><td className="r">{m.latency_p50_ms}</td><td className="r">{m.cost_per_question_usd?.toFixed(4)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="panel">
        <div className="table-wrap" style={{ maxHeight: 600, border: 0 }}>
          <table className="data">
            <thead><tr><th>Case</th><th className="hide-mobile">Tags</th><th className="hide-mobile">Expected</th><th>Got</th><th className="hide-mobile">Tier</th><th className="r hide-mobile">ms</th><th>Result</th></tr></thead>
            <tbody>
              {rep.results.map((r: any) => (
                <tr key={r.id}>
                  <td className="wide-cell" style={{ whiteSpace: "normal" }}><span className="mono small faint">{r.id}</span><div>{r.question}</div></td>
                  <td className="small muted hide-mobile">{r.tags.join(", ")}</td>
                  <td className="small hide-mobile">{r.expected_intent}</td>
                  <td className="small">{r.got_status}</td>
                  <td className="small hide-mobile">{r.got_tier || "–"}</td>
                  <td className="r hide-mobile">{r.latency_ms}</td>
                  <td><span className={r.pass ? "pill-ok" : "pill-bad"}>{r.pass ? "PASS" : r.skipped ? "SKIP" : "FAIL"}</span> <span className="small faint">{r.note}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
