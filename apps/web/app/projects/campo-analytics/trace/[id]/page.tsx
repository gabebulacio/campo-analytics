"use client";

import { use, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { TrustBadge } from "@/components/AnswerCard";
import { CodeBlock } from "@/components/Lineage";
import { localTrace } from "@/lib/traces";

const STAGE_NOTE: Record<string, { he: string; en: string }> = {
  normalize: { he: "שפה, תאריך חיתוך קבוע, זיהוי דפוסים לא בטוחים", en: "Language, fixed as-of date, unsafe-pattern detection" },
  cache: { he: "התשובה הוגשה מהמטמון (שאלה + גרסה סמנטית)", en: "Answer served from cache (question + semantic version)" },
  match_verified: { he: "התאמה דטרמיניסטית מול שאילתות מאומתות (בלי LLM)", en: "Deterministic match against verified queries (no LLM)" },
  follow_up: { he: "כוונון של תשובה קודמת: עורכים את התוכנית שלה (בלי router)", en: "Follow-up on a previous answer: its plan is edited (no router)" },
  route: { he: "מודל מהיר: workspace + כוונה", en: "Fast model: workspace + intent" },
  plan: { he: "Planner עם כלים: QueryPlan, הבהרה או סירוב", en: "Tool-using planner: QueryPlan, clarification or refusal" },
  validate: { he: "התוכנית אומתה מול השכבה הסמנטית", en: "Plan validated against the semantic layer" },
  apply_clarification: { he: "ההבהרה הוחלה על התוכנית הממתינה (בלי LLM)", en: "Clarification applied to the pending plan (no LLM)" },
  compile: { he: "מהדר דטרמיניסטי ← SQL", en: "Deterministic compiler → SQL" },
  execute: { he: "הרצה לקריאה בלבד, timeout ומגבלת שורות", en: "Read-only execution, timeout and row cap" },
  check_result: { he: "בדיקות: ריק, טווחים, התאמה, עדכניות", en: "Checks: empty, bounds, reconciliation, freshness" },
  visualize: { he: "כללים בוחרים את הגרף", en: "Rules choose the chart" },
  explain: { he: "סיכום שנבנה רק ממספרים מהתוצאה", en: "Summary built only from result numbers" },
  sample_rows: { he: "שורות מקור לשושלת", en: "Source rows for lineage" },
};

export default function TracePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useI18n();
  const [tr, setTr] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.trace(id).then(setTr).catch(() => {
      const local = localTrace(id);
      if (local) setTr(local);
      else setErr(true);
    });
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
        <h3>{lang === "he" ? "תשובה" : "Answer"}</h3>
        <p>{a.summary}</p>
      </div>
    </div>
  );
}
