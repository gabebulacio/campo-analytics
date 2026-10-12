"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { Answer } from "@/lib/types";
import { AnswerCard } from "@/components/AnswerCard";
import { Overview } from "@/components/Overview";
import { saveTrace } from "@/lib/traces";
import { DemoTour } from "@/components/DemoTour";
import { ProofStrip } from "@/components/ProofStrip";

const WS_LABEL: Record<string, { es: string; en: string }> = {
  compliance: { es: "Cumplimiento", en: "Compliance" },
  climate: { es: "Clima", en: "Climate" },
  traceability: { es: "Trazabilidad", en: "Traceability" },
  monitoring: { es: "Monitoreo", en: "Monitoring" },
  engagement: { es: "Productores", en: "Producers" },
};

export default function AskPage() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sugg, setSugg] = useState<{ question: string; workspace: string; verified: boolean }[]>([]);
  const [ws, setWs] = useState<string>("all");
  const [allSugg, setAllSugg] = useState(false);
  const answersRef = useRef<HTMLElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.suggestions(lang).then(setSugg).catch(() => setSugg([]));
  }, [lang]);

  // Shareable links: /?q=<question> asks on load.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) ask(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const id = setInterval(() => setStage((s) => Math.min(s + 1, 3)), 900);
    return () => clearInterval(id);
  }, [loading]);

  async function ask(question: string, opts?: { clarification?: string; base?: Answer }) {
    const text = question.trim();
    if (!text || loading) return;
    setError(null);
    setLoading(text);
    requestAnimationFrame(() => answersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    try {
      const body: Parameters<typeof api.ask>[0] = { question: text, lang };
      if (opts?.clarification) {
        body.clarification = opts.clarification;
        if (opts.base?.pending_plan && opts.base.clarify?.dimension) {
          body.pending_plan = opts.base.pending_plan;
          body.dimension = opts.base.clarify.dimension;
        }
      }
      const a = await api.ask(body);
      saveTrace(a);
      setAnswers((prev) => [a, ...prev.filter((p) => p !== opts?.base)]);
      setQ("");
    } catch (e: any) {
      setError(e?.message && e.message !== "Failed to fetch" ? e.message : t("error"));
    } finally {
      setLoading(null);
      ta.current?.focus();
    }
  }

  const filtered = sugg.filter((s) => ws === "all" || s.workspace === ws);
  const shown = allSugg ? filtered : filtered.slice(0, 6);
  const workspaces = Array.from(new Set(sugg.map((s) => s.workspace)));
  const stages = [t("thinking"), t("planning"), t("querying"), t("checking")];

  return (
    <div className="page">
      <section className="hero">
        <div>
          <div className="eyebrow">MVP · {lang === "es" ? "BI generativo sobre capa semántica" : "Generative BI over a semantic layer"}</div>
          <h1 style={{ marginTop: 6 }}>{t("askTitle")}</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: "72ch" }}>{t("askLede")}</p>
          <ProofStrip lang={lang} />
        </div>
        <form
          className="askbox"
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
        >
          <textarea
            ref={ta}
            rows={1}
            value={q}
            maxLength={500}
            placeholder={t("placeholder")}
            aria-label={t("ask")}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(q);
              }
            }}
          />
          <button className="ask-send" type="submit" disabled={!q.trim() || !!loading} aria-label={t("ask")}>
            <ArrowUp size={18} />
          </button>
        </form>
        <DemoTour lang={lang} busy={!!loading} onAsk={(q) => ask(q)} />
        <div className="suggest">
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span className="eyebrow">{t("suggested")}</span>
            <div className="ws-tabs" role="group">
              <button aria-pressed={ws === "all"} onClick={() => setWs("all")}>{t("all")}</button>
              {workspaces.map((w) => (
                <button key={w} aria-pressed={ws === w} onClick={() => setWs(w)}>{WS_LABEL[w]?.[lang] ?? w}</button>
              ))}
            </div>
          </div>
          <div className="suggest-row">
            {shown.map((s) => (
              <button key={s.question} className="chip" onClick={() => ask(s.question)} disabled={!!loading}>
                {s.verified && <span className="vtag" title={t("verified")}><ShieldCheck size={13} /></span>}
                {s.question}
              </button>
            ))}
            {filtered.length > 6 && (
              <button className="btn ghost sm" onClick={() => setAllSugg(!allSugg)}>
                {allSugg ? (lang === "es" ? "Ver menos" : "Show fewer") : (lang === "es" ? `Ver todas (${filtered.length})` : `Show all (${filtered.length})`)}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="answers" ref={answersRef} style={{ scrollMarginTop: 72 }}>
        {error && <div className="callout bad">{error}</div>}
        {loading && (
          <div className="panel answer">
            <h2>{loading}</h2>
            <div className="skeleton">
              {stages.map((s, i) => (
                <div key={s} className={`stage-line ${i < stage ? "done" : i === stage ? "active" : ""}`}><span className="dot" />{s}</div>
              ))}
              <div className="bar" style={{ width: "70%" }} />
              <div className="bar" style={{ width: "45%" }} />
            </div>
          </div>
        )}
        {answers.map((a) => (
          <AnswerCard key={a.trace_id} answer={a} onAsk={ask} />
        ))}
      </section>
      <Overview lang={lang} onAsk={(q) => ask(q)} />
      <p className="footer-note">{t("dataNote")}</p>
    </div>
  );
}
