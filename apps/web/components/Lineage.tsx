"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Copy, X } from "lucide-react";
import type { Answer, Component, Lang, MetricDef } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { fmt, label } from "@/lib/format";

const KW = /\b(with|select|from|left|join|on|where|and|or|group|by|order|limit|as|in|not|is|distinct|union|cross|cast|coalesce|nullif|nulls|last|asc|desc|between|interval|within|true|false|null|double|precision)\b/gi;

export function highlightSql(sql: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const re = /('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|(\b[a-z_]+\.[a-z_][a-z0-9_]*\b)|(\b[a-z_]+(?=\())|(\b(?:with|select|from|left|join|on|where|and|or|group|by|order|limit|as|in|not|is|distinct|union|cross|cast|nulls|last|asc|desc|between|interval|within|true|false|null|double|precision)\b)/gi;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    out += esc(sql.slice(last, m.index));
    const t = esc(m[0]);
    if (m[1]) out += `<span class="k-str">${t}</span>`;
    else if (m[2]) out += `<span class="k-num">${t}</span>`;
    else if (m[3]) out += `<span class="k-col">${t}</span>`;
    else if (m[4]) out += `<span class="k-fn">${t}</span>`;
    else out += `<span class="k-kw">${t}</span>`;
    last = re.lastIndex;
  }
  void KW;
  return out + esc(sql.slice(last));
}

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  return (
    <div>
      <div className="codebar">
        <span className="eyebrow">{title}</span>
        <span style={{ display: "flex", gap: 4 }}>
          <button className="btn ghost sm" onClick={() => setWrap(!wrap)}>{t("wrap")}</button>
          <button
            className="btn ghost sm"
            onClick={() => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); })}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? t("copied") : t("copy")}
          </button>
        </span>
      </div>
      <pre className={`code ${wrap ? "wrap" : ""}`} dangerouslySetInnerHTML={{ __html: highlightSql(code) }} />
    </div>
  );
}

function compText(c: Component | null): string {
  if (!c) return "";
  const where = c.filters.length ? `\n  WHERE ${c.filters.join("\n    AND ")}` : "";
  return `${c.aggregate}(${c.expr})\n  FROM ${c.table}${where}`;
}

function MetricCard({ m, lang }: { m: MetricDef; lang: Lang }) {
  const isRatio = m.type === "ratio";
  return (
    <div className="def">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h3>{label(m.label, lang, m.name)}</h3>
        <span className="badge b-neutral mono">{m.name}</span>
      </div>
      <p className="muted">{m.description}</p>
      <div className="small faint">
        {m.type} · {m.unit} · workspace: {m.workspace}
        {m.requires_filter_or_group.length ? ` · ${lang === "es" ? "requiere" : "requires"}: ${m.requires_filter_or_group.join(", ")}` : ""}
      </div>
      {isRatio ? (
        <>
          <div className="eyebrow">{lang === "es" ? "Numerador" : "Numerator"}{m.numerator_metric ? ` = ${m.numerator_metric}` : ""}</div>
          <div className="formula">{compText(m.numerator)}</div>
          <div className="eyebrow">{lang === "es" ? "Denominador" : "Denominator"}{m.denominator_metric ? ` = ${m.denominator_metric}` : ""}</div>
          <div className="formula">{compText(m.denominator)}</div>
          <div className="small faint">{lang === "es" ? "Cociente de sumas: numerador y denominador se agregan por separado." : "Ratio of sums: numerator and denominator are aggregated separately."}</div>
        </>
      ) : (
        <div className="formula">{compText(m.component)}</div>
      )}
    </div>
  );
}

export function LineageDrawer({ answer, onClose }: { answer: Answer; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<"def" | "filters" | "sql" | "sources" | "sample">("def");
  const ref = useRef<HTMLDivElement>(null);
  const L = answer.lineage!;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tabs = [
    ["def", t("definition")],
    ["filters", t("filters")],
    ["sql", t("sql")],
    ["sources", t("sources")],
    ["sample", t("sample")],
  ] as const;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t("howCalc")} ref={ref} tabIndex={-1}>
        <div className="drawer-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="eyebrow">{t("howCalc")}</span>
            <h3 style={{ overflowWrap: "anywhere" }}>{answer.question}</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="tabs" role="tablist" style={{ padding: "0 12px" }}>
          {tabs.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="drawer-body">
          {tab === "def" && (
            <>
              {L.verified_query && (
                <div className="callout info">
                  <div>
                    <b>{lang === "es" ? "Consulta verificada" : "Verified query"}</b> <span className="mono">{L.verified_query.id}</span>
                    <div>{lang === "es" ? "Responsable" : "Owner"}: {L.verified_query.owner} · {lang === "es" ? "verificada el" : "verified on"} {L.verified_query.verified_at}</div>
                    <div className="faint">“{L.verified_query.canonical_question}”</div>
                  </div>
                </div>
              )}
              {L.metrics.map((m) => <MetricCard key={m.name} m={m} lang={lang} />)}
            </>
          )}
          {tab === "filters" && (
            <>
              <div className="kv">
                <span className="eyebrow">{t("groupedBy")}</span>
                <div>{L.plan.dimensions.length ? L.plan.dimensions.map((d) => <span key={d} className="badge b-neutral mono" style={{ marginRight: 6 }}>{d}</span>) : <span className="muted">—</span>}</div>
              </div>
              <div className="kv">
                <span className="eyebrow">{t("filters")}</span>
                {L.plan.filters.length ? (
                  L.plan.filters.map((f, i) => (
                    <div key={i} className="mono small">{f.dimension} {f.op} [{f.values.join(", ")}]</div>
                  ))
                ) : (
                  <span className="muted">{t("noFilters")}</span>
                )}
              </div>
              <div className="kv">
                <span className="eyebrow">QueryPlan</span>
                <pre className="code wrap">{JSON.stringify(L.plan, null, 2)}</pre>
              </div>
            </>
          )}
          {tab === "sql" && (
            <>
              <p className="small muted">{lang === "es" ? "Generado por el compilador determinístico (mismo plan → mismo SQL). Ejecutado con un rol de solo lectura." : "Generated by the deterministic compiler (same plan → same SQL). Executed with a read-only role."}</p>
              <CodeBlock code={L.sql} title={`${L.engine} · ${L.row_count} ${lang === "es" ? "filas" : "rows"}`} />
            </>
          )}
          {tab === "sources" && (
            <div className="src-list">
              {L.upstream.map((u) => (
                <div className="src" key={u.table}>
                  <span className="t">{u.table}</span>
                  <span className="small muted">{u.grain}</span>
                  <span className="flow">
                    {u.source.split("->").map((s, i, arr) => (
                      <span key={i} style={{ display: "contents" }}>
                        <span>{s.trim()}</span>
                        {i < arr.length - 1 && <ArrowRight size={12} />}
                      </span>
                    ))}
                    <ArrowRight size={12} />
                    <span>{u.table}</span>
                  </span>
                </div>
              ))}
              <p className="small faint">{L.data_origin}</p>
            </div>
          )}
          {tab === "sample" && L.sample && (
            <>
              {L.sample.error ? (
                <p className="muted">{L.sample.error}</p>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="data">
                      <thead><tr>{L.sample.columns!.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {L.sample.rows!.map((r, i) => (
                          <tr key={i}>{r.map((v, j) => <td key={j} className={typeof v === "number" ? "r" : ""}>{typeof v === "number" ? fmt(v, "", lang) : String(v ?? "–")}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <CodeBlock code={L.sample.sql!} title={lang === "es" ? "Consulta de filas de origen" : "Source rows query"} />
                </>
              )}
            </>
          )}
        </div>
        <div className="drawer-foot">
          <span>as_of {L.as_of}</span>
          <span>semantic {L.semantic_version}</span>
          <span>trace <a href={`/trace/${answer.trace_id}`}>{answer.trace_id}</a></span>
          {L.verified_query && <span>vq {L.verified_query.id}</span>}
        </div>
      </aside>
    </>
  );
}
