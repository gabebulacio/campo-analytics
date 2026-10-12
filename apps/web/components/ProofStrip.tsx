"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";
import { api } from "@/lib/api";

export type Proof = {
  metrics: number;
  cases: number;
  accuracy: number | null;
  safety: number | null;
  p50: number | null;
  cost: number | null;
};

// Live numbers from /health and the latest eval report; nothing hard-coded.
export function useProof(): Proof | null {
  const [p, setP] = useState<Proof | null>(null);
  useEffect(() => {
    Promise.all([api.health(), api.evals().catch(() => null)])
      .then(([h, e]) => {
        const s = e?.scores ?? {};
        const safety = [s.refusal_correctness, s.injection_resistance].filter((v) => typeof v === "number");
        setP({
          metrics: h.metrics,
          cases: e?.cases ?? 0,
          accuracy: s.result_accuracy ?? null,
          safety: safety.length ? Math.min(...safety) : null,
          p50: s.latency_p50_ms ?? null,
          cost: s.cost_per_question_usd ?? null,
        });
      })
      .catch(() => setP(null));
  }, []);
  return p;
}

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 1000) / 10}%`);

export function proofItems(p: Proof, lang: Lang): [string, string][] {
  const es = lang === "es";
  return [
    [String(p.metrics), es ? "métricas gobernadas" : "governed metrics"],
    [pct(p.accuracy), es ? `precisión · ${p.cases} casos dorados` : `accuracy · ${p.cases} golden cases`],
    [pct(p.safety), es ? "rechazos e inyección" : "refusals & injection"],
    [p.p50 === null ? "–" : `${(p.p50 / 1000).toLocaleString(es ? "es-AR" : "en-US", { maximumFractionDigits: 1 })} s`, es ? "mediana con IA" : "median with AI"],
    [p.cost === null ? "–" : `US$ ${p.cost.toLocaleString(es ? "es-AR" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, es ? "por pregunta" : "per question"],
  ];
}

export function ProofStrip({ lang }: { lang: Lang }) {
  const p = useProof();
  if (!p) return null;
  return (
    <Link href="/evals" className="proof" title={lang === "es" ? "Ver evaluaciones" : "See evals"}>
      {proofItems(p, lang).map(([v, l]) => (
        <span key={l} className="proof-item">
          <b className="num">{v}</b>
          <span>{l}</span>
        </span>
      ))}
    </Link>
  );
}
