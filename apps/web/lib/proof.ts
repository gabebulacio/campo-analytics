"use client";

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
