"use client";

import type { ReactNode } from "react";
import { ArrowDefs, Box } from "@/components/DiagramBox";
import { useI18n } from "@/lib/i18n";
import { UI, type L } from "./content";

/** Pick the current language from a { en, he } pair. */
export function useT() {
  const { lang } = useI18n();
  return { lang, t: (x: L) => x[lang] };
}

/** `code` segments render as monospace and stay left-to-right in Hebrew. */
export function rich(text: string): ReactNode[] {
  return text.split("`").map((part, i) => (i % 2 ? <span className="mono" key={i}>{part}</span> : part));
}

export const nowrap = { whiteSpace: "nowrap" } as const;
export const section = { display: "flex", flexDirection: "column", gap: 12 } as const;

export function PageHead({ eyebrow, h1, lead }: { eyebrow: string; h1: string; lead?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{h1}</h1>
        {lead && <p className="lead" style={{ marginTop: 8 }}>{lead}</p>}
      </div>
    </div>
  );
}

export function Table({ head, children }: { head?: ReactNode; children: ReactNode }) {
  return (
    <div className="panel table-wrap" style={{ maxHeight: "none" }}>
      <table className="simple">
        {head && <thead>{head}</thead>}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** The architecture flow chart, drawn with the same boxes, arrows and legend as Campo's. */
export function Diagram() {
  const { t, lang } = useT();
  const D = UI.diagram;
  const sw = 158, gap = 22, x0 = 20, y0 = 222; // medallion row
  const sx = (i: number) => x0 + i * (sw + gap);
  return (
    <div className="panel diagram">
      <svg viewBox="0 0 1100 652" role="img" aria-label={t(D.aria)}>
        <ArrowDefs id="ahw" />
        <text className="lbl" x={20} y={14}>{t(D.rowSources)}</text>
        {D.sources.map((s, i) => (
          <g key={s.t.en}>
            <Box x={20 + i * 270} y={22} w={250} h={64} cls="data" title={t(s.t)} sub={t(s.s)} />
            <path className="arr" d={`M${145 + i * 270} 86 V118`} markerEnd="url(#ahw)" />
          </g>
        ))}
        <Box x={20} y={120} w={1060} h={64} cls="data" title={t(D.landing.t)} sub={t(D.landing.s)} />
        <path className="arr" d="M99 184 V220" markerEnd="url(#ahw)" />

        <text className="lbl" x={120} y={214}>{t(D.rowMedallion)}</text>
        {D.stages.map((s, i) => (
          <g key={s.t.en}>
            <Box x={sx(i)} y={y0} w={sw} h={84} cls={s.cls} title={t(s.t)} sub={t(s.s)} />
            {i < D.stages.length - 1 && <path className="arr" d={`M${sx(i) + sw} ${y0 + 42} H${sx(i + 1) - 2}`} markerEnd="url(#ahw)" />}
          </g>
        ))}

        {/* Spark path: same bronze in, same logic, compared with the Python tables by the parity gate */}
        <text className="lbl" x={lang === "he" ? 718 : 384} y={338} direction={lang === "he" ? "rtl" : "ltr"} textAnchor="start">{t(D.rowSpark)}</text>
        <path className="arr" d={`M150 306 V381 H${sx(1) - 2}`} markerEnd="url(#ahw)" />
        {D.spark.map((s, i) => (
          <g key={s.t.en}>
            <Box x={sx(i + 1)} y={346} w={sw} h={70} cls="det" title={t(s.t)} sub={t(s.s)} />
            <path className="arr" d={`M${sx(i + 1) + sw} 381 H${sx(i + 2) - 2}`} markerEnd="url(#ahw)" />
          </g>
        ))}
        <Box x={sx(4)} y={346} w={sw} h={70} cls="ok" title={t(D.parity.t)} sub={t(D.parity.s)} />
        <path className="arr" d={`M${sx(4) + sw / 2} 306 V344`} markerEnd="url(#ahw)" />

        <text className="lbl" x={20} y={462}>{t(D.rowOps)}</text>
        <Box x={20} y={470} w={520} h={70} cls="det" title={t(D.orchestrator.t)} sub={t(D.orchestrator.s)} />
        <path className="arr" d="M110 470 V308" markerEnd="url(#ahw)" />
        <Box x={560} y={470} w={180} h={70} cls="data" title={t(D.mapping.t)} sub={t(D.mapping.s)} />
        <path className="arr" d={`M650 470 V452 H370 V326 H${sx(1) + sw / 2} V308`} markerEnd="url(#ahw)" />
        <Box x={760} y={470} w={320} h={70} cls="ok" title={t(D.ops.t)} sub={t(D.ops.s)} />
        <path className="arr" d={`M${sx(4) + sw / 2} 416 V468`} markerEnd="url(#ahw)" />
        {/* mixed Hebrew + identifiers: lay this one out right-to-left so the words keep their order */}
        <text className="lbl" x={lang === "he" ? 1080 : 760} y={558} direction={lang === "he" ? "rtl" : "ltr"} textAnchor="start">
          {t(D.secrets)}
        </text>

        <text className="lbl" x={20} y={576}>{t(D.rowDelivery)}</text>
        <Box x={20} y={584} w={520} h={56} cls="ok" title={t(D.ci.t)} sub={t(D.ci.s)} />
        <path className="arr" d="M540 612 H558" markerEnd="url(#ahw)" />
        <Box x={560} y={584} w={520} h={56} cls="det" title={t(D.deploy.t)} sub={t(D.deploy.s)} />
      </svg>
      <div className="legend-row">
        {UI.legend.map((l) => {
          const color = { data: "var(--line-strong)", det: "var(--link)", ok: "var(--ok)", ai: "var(--accent)" }[l.cls];
          const fill = { data: "var(--surface-2)", det: "var(--link-soft)", ok: "var(--ok-soft)", ai: "var(--accent-soft)" }[l.cls];
          return <span key={l.cls}><i style={{ borderColor: color, background: fill }} />{t(l)}</span>;
        })}
      </div>
    </div>
  );
}
