"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { TrustBadge } from "@/components/AnswerCard";
import { localTraces } from "@/lib/traces";

export default function Traces() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    const local = localTraces().map((t) => ({ trace_id: t.trace_id, at: t.at, question: t.question, status: t.answer.status, tier: t.answer.tier, latency_ms: t.answer.latency_ms, usd: t.answer.cost?.usd }));
    const merge = (remote: any[]) => {
      const seen = new Set(remote.map((r) => r.trace_id));
      setItems([...remote, ...local.filter((l) => !seen.has(l.trace_id))].sort((a, b) => String(b.at).localeCompare(String(a.at))));
    };
    api.traces().then(merge).catch(() => merge([]));
  }, []);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{lang === "es" ? "Observabilidad (interno)" : "Observability (internal)"}</div>
          <h1>{t("traces")}</h1>
          <p className="lede">{lang === "es" ? "Cada pregunta deja una traza por etapa: ruteo, match verificado, plan, validación, SQL, ejecución, chequeos, costo." : "Every question leaves a per-stage trace: routing, verified match, plan, validation, SQL, execution, checks, cost."}</p>
        </div>
      </div>
      {items && items.length === 0 && <div className="panel empty"><Activity size={24} /><b>{lang === "es" ? "Sin trazas todavía." : "No traces yet."}</b></div>}
      {items && items.length > 0 && (
        <div className="panel table-wrap" style={{ maxHeight: "none" }}>
          <table className="data">
            <thead><tr><th>Trace</th><th>{lang === "es" ? "Pregunta" : "Question"}</th><th>Tier</th><th className="r">ms</th><th className="r">US$</th></tr></thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.trace_id}>
                  <td className="mono"><Link href={`/trace/${x.trace_id}`}>{x.trace_id}</Link></td>
                  <td style={{ whiteSpace: "normal" }}>{x.question}</td>
                  <td><TrustBadge tier={x.tier} clarifying={x.status === "clarification"} /></td>
                  <td className="r">{x.latency_ms}</td>
                  <td className="r">{(x.usd ?? 0).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
