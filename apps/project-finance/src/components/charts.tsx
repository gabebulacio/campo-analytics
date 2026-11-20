import { useState } from "react";
import type { Project } from "../types";
import { monthLabel, pct, shortName, usd, usdShort } from "../format";
import { TipRow, Tooltip, niceTicks, useWidth, type TipState } from "./common";

/**
 * Bullet graph from zero: solid bar = committed spend (AC), outlined marker = revised SOW (PL),
 * dark tick = % complete applied to the revised SOW. Inline (table cell) or block size.
 */
export function Bullet({ p, max, width = 160, height = 14 }: { p: Project; max: number; width?: number; height?: number }) {
  const x = (v: number) => Math.max(0, Math.min(width, (v / (max || 1)) * width));
  const done = p.pct_complete != null ? p.revised * p.pct_complete : null;
  const over = p.committed > p.revised;
  return (
    <svg width={width} height={height + 6} role="img" aria-label={`${usd(p.committed)} committed of ${usd(p.revised)} revised SOW`}>
      <rect x={0} y={3} width={width} height={height} fill="var(--sunk)" rx={2} />
      <rect x={0} y={3 + height * 0.25} width={x(p.committed)} height={height * 0.5} fill={over ? "var(--critical)" : "var(--series-1)"} rx={2} />
      <rect x={x(p.revised) - 1.5} y={1} width={3} height={height + 4} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      {done != null && <rect x={x(done) - 1} y={3} width={2} height={height} fill="var(--ink-2)" />}
    </svg>
  );
}

/** Pace = fee burn (y) vs % complete (x); y = x line; flagged points labelled. */
export function PaceScatter({ projects, flagged, onPick, title }: { projects: Project[]; flagged: Set<string>; onPick: (id: string) => void; title: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TipState | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [table, setTable] = useState(false);
  const pts = projects.filter((p) => p.pct_complete != null && p.fee_burn != null && p.revised_fee > 0);
  const H = 360, m = { t: 14, r: 16, b: 38, l: 46 };
  const iw = width - m.l - m.r, ih = H - m.t - m.b;
  const cap = 1.5;
  const maxX = Math.max(1, ...pts.map((p) => p.pct_complete ?? 0)) * 1.02;
  const maxY = Math.min(cap, Math.max(1.05, ...pts.map((p) => p.fee_burn ?? 0)));
  const above = pts.filter((p) => (p.fee_burn ?? 0) > cap).length;
  const X = (v: number) => m.l + (Math.min(v, maxX) / maxX) * iw;
  const Y = (v: number) => m.t + ih - (Math.min(v, maxY) / maxY) * ih;
  const xticks = [0, 0.25, 0.5, 0.75, 1].filter((t) => t <= maxX + 1e-9);
  const yticks = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5].filter((t) => t <= maxY + 1e-9);
  const dollarsAhead = (p: Project) => (p.fee_burn! - p.pct_complete!) * p.revised_fee;
  const labelled = pts.filter((p) => flagged.has(p.id)).sort((a, b) => dollarsAhead(b) - dollarsAhead(a)).slice(0, 3);
  const move = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    let best: Project | null = null, bd = 24 * 24;
    for (const p of pts) {
      const d = (X(p.pct_complete!) - mx) ** 2 + (Y(p.fee_burn!) - my) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    setHover(best?.id ?? null);
    setTip(best ? { x: e.clientX, y: e.clientY, content: (
      <>
        <div className="t-title">{shortName(best.name)}</div>
        <TipRow k="Client" v={best.client_name} />
        <TipRow k="Fee burn" v={pct(best.fee_burn)} />
        <TipRow k="% complete" v={pct(best.pct_complete)} />
        <TipRow k="Revised fee" v={usd(best.revised_fee)} />
      </>) } : null);
  };
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p className="desc">Fee burn against reported % complete, one dot per project. Above the line, fee is being spent faster than work is completed.</p>
        </div>
        <button className="toggle" onClick={() => setTable((t) => !t)}>{table ? "Show chart" : "Show table"}</button>
      </div>
      <div ref={ref}>
        {table ? (
          <div className="table-wrap" style={{ maxHeight: H, overflowY: "auto" }}>
            <table className="data">
              <thead><tr><th>Project</th><th>Client</th><th className="num">% complete</th><th className="num">Fee burn</th></tr></thead>
              <tbody>{[...pts].sort((a, b) => (b.fee_burn! - b.pct_complete!) - (a.fee_burn! - a.pct_complete!)).map((p) => (
                <tr key={p.id}><td className="cell-main">{shortName(p.name)}</td><td>{p.client_name}</td><td className="num">{pct(p.pct_complete)}</td><td className="num">{pct(p.fee_burn)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : pts.length === 0 ? <div className="empty">No projects with a reported % complete in this scope.</div> : (
          <svg width={width} height={H} role="img" aria-label={title} onMouseMove={move}
            onMouseLeave={() => { setTip(null); setHover(null); }} onClick={() => hover && onPick(hover)} style={{ cursor: hover ? "pointer" : "default" }}>
            <path d={`M${X(0)},${Y(0)} L${X(Math.min(maxX, maxY))},${Y(Math.min(maxX, maxY))} L${X(maxX)},${Y(Math.min(maxX, maxY))} L${X(maxX)},${Y(maxY)} L${X(0)},${Y(maxY)} Z`} fill="var(--sunk)" />
            {yticks.map((t) => (
              <g key={`y${t}`}><line className="grid" x1={m.l} x2={m.l + iw} y1={Y(t)} y2={Y(t)} />
                <text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{pct(t)}</text></g>
            ))}
            {xticks.map((t) => <text key={`x${t}`} x={X(t)} y={H - m.b + 16} textAnchor="middle">{pct(t)}</text>)}
            <line className="base" x1={m.l} x2={m.l + iw} y1={Y(0)} y2={Y(0)} />
            <line x1={X(0)} y1={Y(0)} x2={X(Math.min(maxX, maxY))} y2={Y(Math.min(maxX, maxY))} stroke="var(--ink-2)" strokeWidth={1.25} />
            <text x={m.l + 8} y={m.t + 14} className="lbl">fee spent ahead of delivery</text>
            <text x={m.l + iw / 2} y={H - 4} textAnchor="middle">Reported % complete (as-of month)</text>
            <text x={12} y={m.t + ih / 2} textAnchor="middle" transform={`rotate(-90 12 ${m.t + ih / 2})`}>Fee burn</text>
            {pts.filter((p) => !flagged.has(p.id)).map((p) => (
              <circle key={p.id} cx={X(p.pct_complete!)} cy={Y(p.fee_burn!)} r={hover === p.id ? 6 : 4.5} fill="var(--series-1)" stroke="var(--card)" strokeWidth={1.5} opacity={0.85} />
            ))}
            {pts.filter((p) => flagged.has(p.id)).map((p) => (
              <circle key={p.id} cx={X(p.pct_complete!)} cy={Y(p.fee_burn!)} r={hover === p.id ? 7 : 5.5} fill="var(--critical)" stroke="var(--card)" strokeWidth={2} />
            ))}
            {labelled.map((p, i) => {
              const px = X(p.pct_complete!), py = Y(p.fee_burn!);
              const right = px < m.l + iw * 0.55;
              const ly = m.t + 36 + i * 18;
              return (
                <g key={p.id}>
                  <line x1={px} y1={py} x2={right ? px + 14 : px - 14} y2={ly - 4} stroke="var(--ink-2)" strokeWidth={0.75} />
                  <text x={right ? px + 16 : px - 16} y={ly} textAnchor={right ? "start" : "end"} className="lbl-strong">{shortName(p.name).slice(0, 38)}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
      {!table && pts.length > 0 && (
        <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>
          Diagonal = on pace (fee burn equals % complete). Red = close to budget cap; the 3 with the most fee ahead are labelled.
          {above > 0 && ` ${above} project${above > 1 ? "s" : ""} above 150% fee burn ${above > 1 ? "are" : "is"} drawn at the top edge.`}
        </p>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

/** Monthly fee delivered, 2026 (actual solid). Phasing isn't modelled, so no plan line. */
export function MonthlyColumns({ values, asOfMonth, title }: { values: number[]; asOfMonth: number; title: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<TipState | null>(null);
  const [table, setTable] = useState(false);
  const H = 220, m = { t: 16, r: 12, b: 26, l: 52 };
  const iw = width - m.l - m.r, ih = H - m.t - m.b;
  const ticks = niceTicks(Math.max(1, ...values));
  const max = ticks[ticks.length - 1];
  const band = iw / 12, bw = Math.min(26, band * 0.56);
  const cx = (i: number) => m.l + band * i + band / 2;
  const Y = (v: number) => m.t + ih - (v / max) * ih;
  return (
    <div className="card">
      <div className="card-head">
        <div><h2>{title}</h2><p className="desc">Fee booked per month from time entries (approved and unapproved). {monthLabel(asOfMonth)} is month to date.</p></div>
        <button className="toggle" onClick={() => setTable((t) => !t)}>{table ? "Show chart" : "Show table"}</button>
      </div>
      <div ref={ref}>
        {values.every((v) => v === 0) ? <div className="empty">No time booked on this project in 2026.</div> : table ? (
          <table className="data"><thead><tr><th>Month</th><th className="num">Fee</th></tr></thead>
            <tbody>{values.map((v, i) => <tr key={i}><td>{monthLabel(i + 1)}</td><td className="num">{usd(v)}</td></tr>)}</tbody></table>
        ) : (
          <svg width={width} height={H} role="img" aria-label={title} onMouseLeave={() => setTip(null)}>
            {ticks.map((t) => (
              <g key={t}><line className={t === 0 ? "base" : "grid"} x1={m.l} x2={m.l + iw} y1={Y(t)} y2={Y(t)} />
                <text x={m.l - 8} y={Y(t) + 4} textAnchor="end">{usdShort(t)}</text></g>
            ))}
            {values.map((v, i) => (
              <g key={i}>
                {v > 0 && <path d={`M${cx(i) - bw / 2},${Y(0)} V${Y(v) + 3} q0,-3 3,-3 H${cx(i) + bw / 2 - 3} q3,0 3,3 V${Y(0)} Z`}
                  fill="var(--series-1)" opacity={i + 1 > asOfMonth ? 0.35 : i + 1 === asOfMonth ? 0.7 : 1} />}
                <text x={cx(i)} y={H - 8} textAnchor="middle">{monthLabel(i + 1)}</text>
                <rect x={cx(i) - band / 2} y={m.t} width={band} height={ih} fill="transparent"
                  onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><div className="t-title">{monthLabel(i + 1)} 2026</div><TipRow k="Fee booked" v={usd(v)} /></> })} />
              </g>
            ))}
          </svg>
        )}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

/** Signed deviation bars, sorted; sign + label carry meaning, colour only adds. */
export function DeviationBars({ rows, title, desc }: { rows: { label: string; value: number; sub?: string }[]; title: string; desc: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [table, setTable] = useState(false);
  const sorted = [...rows].sort((a, b) => a.value - b.value);
  const max = Math.max(1, ...sorted.map((r) => Math.abs(r.value)));
  const labelW = Math.min(180, width * 0.34), valW = 72;
  const plot = width - labelW - valW - 8;
  const zero = labelW + (sorted.some((r) => r.value < 0) ? plot / 2 : 0);
  const scale = (sorted.some((r) => r.value < 0) ? plot / 2 : plot) / max;
  const rowH = 24;
  return (
    <div className="card">
      <div className="card-head"><div><h2>{title}</h2><p className="desc">{desc}</p></div>
        <button className="toggle" onClick={() => setTable((t) => !t)}>{table ? "Show chart" : "Show table"}</button></div>
      <div ref={ref}>
        {table ? (
          <table className="data"><thead><tr><th>Group</th><th className="num">Value</th></tr></thead>
            <tbody>{sorted.map((r) => <tr key={r.label}><td>{r.label}</td><td className="num">{usd(r.value)}</td></tr>)}</tbody></table>
        ) : (
          <svg width={width} height={sorted.length * rowH + 8} role="img" aria-label={title}>
            <line className="base" x1={zero} x2={zero} y1={0} y2={sorted.length * rowH + 4} />
            {sorted.map((r, i) => {
              const w = Math.abs(r.value) * scale, y = i * rowH + 6;
              return (
                <g key={r.label}>
                  <text x={labelW - 8} y={y + 12} textAnchor="end" className="lbl">{r.label.slice(0, 26)}</text>
                  <rect x={r.value < 0 ? zero - w : zero} y={y + 2} width={Math.max(1, w)} height={rowH - 10} rx={2}
                    fill={r.value < 0 ? "var(--critical)" : "var(--series-2)"} />
                  <text x={width - 4} y={y + 12} textAnchor="end" className={r.value < 0 ? "lbl-strong" : "lbl"}>{usdShort(r.value)}</text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
