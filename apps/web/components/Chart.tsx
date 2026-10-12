"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Answer, Lang } from "@/lib/types";
import { fmt, label } from "@/lib/format";

// Categorical slots in fixed order (style guide §7.1); colour follows the entity, never its rank.
const SERIES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);

function Tip({ active, payload, labelText, unit, lang }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <div className="t">{labelText}</div>
      {payload.map((p: any) => (
        <div className="row" key={p.dataKey}>
          <span><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: p.color, marginRight: 6 }} />{p.name}</span>
          <b>{fmt(p.value, unit, lang)}</b>
        </div>
      ))}
    </div>
  );
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function Chart({ answer, lang }: { answer: Answer; lang: Lang }) {
  const narrow = useNarrow();
  const { chart, data } = answer;
  if (!chart || !data || chart.type === "table" || chart.type === "kpi") return null;
  const idx = Object.fromEntries(data.columns.map((c, i) => [c, i]));
  const meta = Object.fromEntries(data.meta.map((m) => [m.name, m]));
  const y = chart.y;
  const unit = chart.unit;
  const yLabel = label(meta[y]?.label, lang, y);
  const tickFmt = (v: number) => fmt(v, unit, lang, true);
  const axis = { stroke: "var(--ink-3)", fontSize: 12, tickLine: false };

  if (chart.series && chart.x) {
    // pivot: x -> {series: value}; series keep first-seen order (stable colours)
    const seriesKeys: string[] = [];
    const byX = new Map<string, Record<string, any>>();
    for (const r of data.rows) {
      const x = String(r[idx[chart.x]]);
      const s = String(r[idx[chart.series]]);
      if (!seriesKeys.includes(s)) seriesKeys.push(s);
      if (!byX.has(x)) byX.set(x, { x });
      byX.get(x)![s] = r[idx[y]];
    }
    seriesKeys.sort();
    const rows = [...byX.values()];
    const legend = (
      <div className="legend">
        {seriesKeys.map((s, i) => (
          <span key={s}><i style={{ background: SERIES[i % 8] }} />{s}</span>
        ))}
      </div>
    );
    return (
      <div>
        {legend}
        <div className="chart-wrap" role="img" aria-label={`${yLabel} by ${chart.x} and ${chart.series}`}>
          <ResponsiveContainer>
            {chart.type === "line" ? (
              <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="x" {...axis} axisLine={{ stroke: "var(--line-strong)" }} />
                <YAxis tickFormatter={tickFmt} {...axis} axisLine={false} width={72} />
                <Tooltip content={(p: any) => <Tip {...p} labelText={p.label} unit={unit} lang={lang} />} />
                {seriesKeys.map((s, i) => (
                  <Line key={s} dataKey={s} name={s} stroke={SERIES[i % 8]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls isAnimationActive={false} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={rows} margin={{ top: 12, right: 24, bottom: 4, left: 8 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="x" {...axis} axisLine={{ stroke: "var(--line-strong)" }} interval={0} angle={rows.length > 6 ? -20 : 0} textAnchor={rows.length > 6 ? "end" : "middle"} height={rows.length > 6 ? 60 : 30} />
                <YAxis tickFormatter={tickFmt} {...axis} axisLine={false} width={72} />
                <Tooltip cursor={{ fill: "var(--surface-2)" }} content={(p: any) => <Tip {...p} labelText={p.label} unit={unit} lang={lang} />} />
                {seriesKeys.map((s, i) => (
                  <Bar key={s} dataKey={s} name={s} fill={SERIES[i % 8]} stackId={chart.type === "stacked_bar" ? "a" : undefined} radius={chart.type === "stacked_bar" ? 0 : [4, 4, 0, 0]} isAnimationActive={false} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const rows = data.rows.map((r) => ({ x: String(r[idx[chart.x!]] ?? "–"), v: r[idx[y]] as number }));
  if (chart.type === "line") {
    return (
      <div className="chart-wrap" role="img" aria-label={`${yLabel} over ${chart.x}`}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 12, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="x" {...axis} axisLine={{ stroke: "var(--line-strong)" }} />
            <YAxis tickFormatter={tickFmt} {...axis} axisLine={false} width={72} />
            <Tooltip content={(p: any) => <Tip {...p} labelText={p.label} unit={unit} lang={lang} />} />
            <Line dataKey="v" name={yLabel} stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  // horizontal bar, sorted as returned (desc by metric)
  const h = Math.max(160, rows.length * 34 + 40);
  return (
    <div style={{ width: "100%", height: h }} role="img" aria-label={`${yLabel} by ${chart.x}`}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: narrow ? 60 : 64, bottom: 4, left: narrow ? 0 : 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tickFormatter={tickFmt} {...axis} axisLine={{ stroke: "var(--line-strong)" }} />
          <YAxis type="category" dataKey="x" {...axis} axisLine={false} width={narrow ? 96 : 170} tick={{ fill: "var(--ink-2)", fontSize: narrow ? 11 : 12 }} />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={(p: any) => <Tip {...p} labelText={p.label} unit={unit} lang={lang} />} />
          <Bar dataKey="v" name={yLabel} fill={SERIES[0]} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} label={{ position: "right", fill: "var(--ink-2)", fontSize: 12, formatter: (v: any) => fmt(v, unit, lang, true) }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Kpis({ answer, lang }: { answer: Answer; lang: Lang }) {
  const { data } = answer;
  if (!data || !data.rows.length) return null;
  return (
    <div className="kpis">
      {data.meta.filter((m) => m.kind === "metric").map((m) => (
        <div className="kpi" key={m.name}>
          <span className="eyebrow">{label(m.label, lang, m.name)}</span>
          <span className="v">{fmt(data.rows[0][data.columns.indexOf(m.name)], m.unit, lang)}</span>
        </div>
      ))}
    </div>
  );
}

export function DataTable({ answer, lang }: { answer: Answer; lang: Lang }) {
  const { data } = answer;
  if (!data) return null;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>{data.meta.map((m) => <th key={m.name} className={m.kind === "metric" ? "r" : ""}>{label(m.label, lang, m.name)}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i}>
              {data.meta.map((m, j) => <td key={m.name} className={m.kind === "metric" ? "r" : ""}>{m.kind === "metric" ? fmt(r[j], m.unit, lang) : String(r[j] ?? "–")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
