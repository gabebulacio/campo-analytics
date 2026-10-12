"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CircleSlash, FlaskConical, HelpCircle, Info, Layers, Pin, ShieldCheck, Table2, ThumbsDown, ThumbsUp, XOctagon } from "lucide-react";
import type { Answer, Tier } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { isPinned, pin } from "@/lib/pins";
import { label } from "@/lib/format";
import dynamic from "next/dynamic";
import { Chart, DataTable, Kpis } from "./Chart";
import { PipelineStrip } from "./PipelineStrip";
import { fmt } from "@/lib/format";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="bar" style={{ height: 360 }} /> });
import { LineageDrawer } from "./Lineage";

export function TrustBadge({ tier, clarifying }: { tier: Tier; clarifying?: boolean }) {
  const { t } = useI18n();
  if (clarifying) return <span className="badge b-info"><HelpCircle size={13} />{t("needsInfo")}</span>;
  switch (tier) {
    case "VERIFIED":
      return <span className="badge b-ok"><ShieldCheck size={13} />{t("verified")}</span>;
    case "GOVERNED":
      return <span className="badge b-info"><Layers size={13} />{t("governed")}</span>;
    case "EXPLORATORY":
      return <span className="badge b-warn"><FlaskConical size={13} />{t("exploratory")}</span>;
    default:
      return <span className="badge b-none"><CircleSlash size={13} />{t("notAnswered")}</span>;
  }
}

export function AnswerCard({ answer, onAsk, compact = false }: { answer: Answer; onAsk: (q: string, opts?: { clarification?: string; base?: Answer; refine?: Answer }) => void; compact?: boolean }) {
  const { t, lang } = useI18n();
  const [showLineage, setShowLineage] = useState(false);
  const [view, setView] = useState<"chart" | "table" | "bars">("chart");
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [pinned, setPinned] = useState(false);
  const [followUp, setFollowUp] = useState("");
  useEffect(() => setPinned(isPinned(answer.question, answer.clarification)), [answer.question, answer.clarification]);

  const summary = answer.summary_i18n ? answer.summary_i18n[lang] : answer.summary;
  const chartType = answer.chart?.type;
  const hasChart = answer.status === "answered" && chartType && chartType !== "table" && chartType !== "kpi";
  const isMap = chartType === "map" && !!answer.geo;
  const mapPoints = isMap && answer.data ? answer.data.rows.map((r) => {
    const di = answer.data!.columns.indexOf(answer.chart!.x!);
    const yi = answer.data!.columns.indexOf(answer.chart!.y);
    const second = answer.data!.meta.filter((m) => m.kind === "metric")[1];
    const si = second ? answer.data!.columns.indexOf(second.name) : -1;
    return { name: String(r[di]), latlon: answer.geo!.points[String(r[di])], value: r[yi] as number, size: si >= 0 ? (r[si] as number) : (r[yi] as number),
      extra: answer.data!.meta.filter((m) => m.kind === "metric" && m.name !== answer.chart!.y).map((m) => ({ label: label(m.label, lang, m.name), value: fmt(r[answer.data!.columns.indexOf(m.name)], m.unit, lang) })) };
  }).filter((p) => p.latlon) : [];
  const warnings = answer.warnings.filter((w) => w.level !== "info");
  const notes = answer.warnings.filter((w) => w.level === "info");

  return (
    <article className="panel answer" aria-live="polite">
      <div className="answer-head">
        <div className="q">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <TrustBadge tier={answer.tier} clarifying={answer.status === "clarification"} />
            {answer.cached_from && <span className="badge b-neutral">cache</span>}
          </div>
          <h2>{answer.question}</h2>
          {answer.clarification && <span className="small muted">→ {answer.clarification}</span>}
          {answer.refines && <span className="small muted">{lang === "es" ? "Ajuste de:" : "Adjusting:"} {answer.refines}</span>}
        </div>
        {answer.status === "answered" && !compact && (
          <div className="answer-actions">
            {isMap && (
              <button className="btn sm" onClick={() => setView(view === "bars" ? "chart" : "bars")}>
                <BarChart3 size={14} /> {view === "bars" ? t("showMap") : t("showBars")}
              </button>
            )}
            {hasChart && (
              <button className="btn sm" onClick={() => setView(view === "table" ? "chart" : "table")}>
                {view !== "table" ? <Table2 size={14} /> : <BarChart3 size={14} />} {view !== "table" ? t("showTable") : t("showChart")}
              </button>
            )}
            <button className="btn sm" disabled={pinned} onClick={() => { pin({ question: answer.question, clarification: answer.clarification, plan: answer.plan }); setPinned(true); }}>
              <Pin size={14} /> {pinned ? t("pinned") : t("pin")}
            </button>
            <button className="btn sm primary" onClick={() => setShowLineage(true)}>{t("howCalc")}</button>
          </div>
        )}
      </div>

      {answer.status !== "clarification" && <p className="summary">{summary}</p>}

      {warnings.map((w, i) => (
        <div key={i} className={`callout ${w.level === "bad" ? "bad" : "warn"}`} role="status">
          {w.level === "bad" ? <XOctagon size={16} color="var(--bad)" /> : <AlertTriangle size={16} color="var(--warn)" />}
          <span>{w.message[lang]}</span>
        </div>
      ))}

      {answer.status === "answered" && (
        <>
          {chartType === "kpi" && <Kpis answer={answer} lang={lang} />}
          {chartType !== "kpi" && answer.headline && answer.headline.length > 0 && (
            <div className="headline">
              {answer.headline.map((h) => (
                <div key={h.metric} className="hl">
                  <span className="eyebrow">{label(h.label, lang, h.metric)}</span>
                  <span className="hl-v">{fmt(h.value, h.unit, lang)}</span>
                  <span className="small faint">{t("overall")}</span>
                </div>
              ))}
            </div>
          )}
          {isMap && view === "chart" && <MapView points={mapPoints} unit={answer.chart!.unit} lang={lang} legendLabel={label(answer.data!.meta.find((m) => m.name === answer.chart!.y)?.label, lang, answer.chart!.y)} />}
          {isMap && view === "bars" && <Chart answer={{ ...answer, chart: { ...answer.chart!, type: "bar" } }} lang={lang} />}
          {hasChart && !isMap && view === "chart" && <Chart answer={answer} lang={lang} />}
          {(chartType === "table" || view === "table") && <DataTable answer={answer} lang={lang} />}
          {notes.length > 0 && (
            <div className="callout info"><Info size={16} /><span>{notes.map((n) => n.message[lang]).join(" · ")}</span></div>
          )}
        </>
      )}

      {answer.status === "clarification" && answer.clarify && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="summary">{answer.clarify.question}</p>
          <div className="options">
            {answer.clarify.options.map((o) => (
              <button key={o} className="chip" onClick={() => onAsk(answer.question, { clarification: o, base: answer })}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {answer.status === "not_answered" && answer.refusal && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {answer.refusal.closest.length > 0 && (
            <>
              <span className="eyebrow">{t("closest")}</span>
              <div className="options">
                {answer.refusal.closest.map((c) => (
                  <button key={c.metric} className="chip" title={c.description} onClick={() => onAsk(c.question[lang])}>{label(c.label, lang, c.metric)}</button>
                ))}
              </div>
            </>
          )}
          {answer.refusal.suggestions.length > 0 && (
            <>
              <span className="eyebrow">{t("tryThese")}</span>
              <div className="options">
                {answer.refusal.suggestions.map((s) => (
                  <button key={s.verified_query_id} className="chip" onClick={() => onAsk(s.question.replace("{campaign}", "2024/25").replace("{standard}", "EUDR"))}>
                    <span className="vtag"><ShieldCheck size={13} /></span>{s.question.replace("{campaign}", "2024/25").replace("{standard}", "EUDR")}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {answer.status === "answered" && answer.plan && !compact && (
        <form
          className="followup"
          onSubmit={(e) => {
            e.preventDefault();
            const text = followUp.trim();
            if (!text) return;
            onAsk(text, { refine: answer });
            setFollowUp("");
          }}
        >
          <input
            value={followUp}
            maxLength={300}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder={lang === "es" ? "Ajustar: «por provincia», «solo Argentina», «como tabla»…" : "Adjust: “by province”, “only Argentina”, “as a table”…"}
            aria-label={lang === "es" ? "Ajustar esta respuesta" : "Adjust this answer"}
          />
          <button className="btn sm" type="submit" disabled={!followUp.trim()}>{lang === "es" ? "Ajustar" : "Adjust"}</button>
        </form>
      )}

      {!compact && <PipelineStrip answer={answer} lang={lang} />}
      <div className="meta-row">
        <span>{answer.latency_ms} ms</span>
        <span>US$ {(answer.cost?.usd ?? 0).toFixed(4)}</span>
        <span>as_of {answer.as_of}</span>
        <a href={`/trace/${answer.trace_id}`}>trace {answer.trace_id}</a>
        <span className="spacer" />
        <span className="fb">
          <button aria-label="Helpful" aria-pressed={vote === "up"} onClick={() => { setVote("up"); api.feedback(answer.trace_id, "up").catch(() => {}); }}><ThumbsUp size={14} /></button>
          <button aria-label="Not helpful" aria-pressed={vote === "down"} onClick={() => { setVote("down"); api.feedback(answer.trace_id, "down").catch(() => {}); }}><ThumbsDown size={14} /></button>
        </span>
      </div>
      {showLineage && answer.lineage && <LineageDrawer answer={answer} onClose={() => setShowLineage(false)} />}
    </article>
  );
}
