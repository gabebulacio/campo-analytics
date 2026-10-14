"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layers, Leaf, MapPinned, Package, Satellite, ShieldCheck, Sprout, Users } from "lucide-react";
import type { Lang } from "@/lib/types";
import { api } from "@/lib/api";
import { fmt, label } from "@/lib/format";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="bar" style={{ height: 380 }} /> });

const ICON: Record<string, React.ReactNode> = {
  assessed_hectares: <MapPinned size={16} />,
  deforestation_free_share: <ShieldCheck size={16} />,
  compliance_rate: <Layers size={16} />,
  traced_volume_t: <Package size={16} />,
  origin_coverage: <Sprout size={16} />,
  emissions_intensity: <Leaf size={16} />,
  active_producers: <Users size={16} />,
  open_alerts: <Satellite size={16} />,
};

const SPARK: Record<string, string> = {
  compliance_rate: "compliance_rate",
  emissions_intensity: "emissions_intensity",
  open_alerts: "alerts",
};

function Spark({ points, unit, lang, color = "var(--series-1)" }: { points: { x: string; y: number }[]; unit: string; lang: Lang; color?: string }) {
  const id = "g" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <div style={{ width: "100%", height: 44 }}>
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="x" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={{ stroke: "var(--line-strong)" }}
            content={({ active, payload, label: l }: any) =>
              active && payload?.length ? <div className="tooltip"><div className="t">{l}</div><b>{fmt(payload[0].value, unit, lang)}</b></div> : null
            }
          />
          <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Overview({ lang, onAsk }: { lang: Lang; onAsk: (q: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.overview().then(setData).catch(() => setErr(true));
  }, []);
  if (err) return null;
  if (!data)
    return (
      <section className="overview">
        <div className="kpi-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="kpi-card"><div className="bar" /><div className="bar" style={{ width: "50%" }} /></div>)}</div>
      </section>
    );

  const he = lang === "he";
  const trends = data.trends;
  const askFor: Record<string, string> = {
    assessed_hectares: he ? "הקטארים שנבדקו ל-EUDR לפי מדינה" : "EUDR assessed hectares by country",
    deforestation_free_share: he ? "איזה אחוז מהשטח נקי מבירוא יערות לפי EUDR, לפי מדינה?" : "What share of area is EUDR deforestation-free by country?",
    compliance_rate: he ? "מה שיעור הציות לפי תקן בעונה 2024/25?" : "What is the compliance rate by standard for season 2024/25?",
    traced_volume_t: he ? "נפח עם עקיבות לפי סחורה" : "Traced volume by commodity",
    origin_coverage: he ? "מה כיסוי המקור לפי תוכנית?" : "Origin coverage by program",
    emissions_intensity: he ? "איך השתנתה עצימות הפליטות לפי גידול?" : "How has emissions intensity evolved by crop?",
    active_producers: he ? "כמה יצרנים פעילים יש לפי מדינה?" : "Active producers by country",
    open_alerts: he ? "כמה התראות פתוחות יש לפי סוג וחומרה?" : "How many open alerts are there by type and severity?",
  };

  return (
    <section className="overview">
      <div className="section-head">
        <div>
          <h2>{he ? "תמונת מצב" : "Overview"}</h2>
          <p className="small muted">{he ? `נתונים נכון ל-${data.as_of}. לחצו על מדד כדי לראות את הפירוט.` : `Data as of ${data.as_of}. Click an indicator to see the breakdown.`}</p>
        </div>
      </div>
      <div className="kpi-grid">
        {data.kpis.map((k: any) => {
          const spark = SPARK[k.metric] ? trends[SPARK[k.metric]] : null;
          return (
            <button key={k.metric} className="kpi-card" onClick={() => onAsk(askFor[k.metric])} title={he ? "לשאול על הפירוט" : "Ask for the breakdown"}>
              <span className="kpi-top">
                <span className="kpi-icon">{ICON[k.metric]}</span>
                <span className="eyebrow">{label(k.label, lang)}</span>
              </span>
              <span className="kpi-v">{fmt(k.value, k.unit, lang, true)}</span>
              <span className="small faint">{k.filter?.standard ? `${he ? "תקן" : "Standard"}: ${k.filter.standard}` : he ? "כל התוכניות" : "All programs"}</span>
              {spark && <Spark points={spark.points.slice(-24)} unit={spark.unit} lang={lang} color={k.metric === "open_alerts" ? "var(--series-2)" : "var(--series-1)"} />}
            </button>
          );
        })}
      </div>
      <div className="overview-row">
        <div className="panel ov-map">
          <div className="panel-head">
            <div>
              <h3>{he ? "EUDR: % ללא בירוא יערות לפי מחוז" : "EUDR: deforestation-free share by province"}</h3>
              <p className="small muted">{he ? "צבע = % ללא בירוא יערות · גודל = הקטארים שנבדקו" : "Colour = deforestation-free share · size = assessed hectares"}</p>
            </div>
          </div>
          <MapView
            lang={lang}
            unit="ratio"
            sizeUnit="ha"
            legendLabel={he ? "% ללא בירוא" : "% free"}
            points={data.regions.filter((r: any) => r.latlon).map((r: any) => ({
              name: r.name,
              latlon: r.latlon,
              value: r.deforestation_free_share,
              size: r.assessed_hectares,
              extra: [
                { label: he ? "הקטארים שנבדקו" : "Assessed ha", value: fmt(r.assessed_hectares, "ha", lang) },
                { label: he ? "חלקות עם הסבה" : "Fields with conversion", value: fmt(r.fields_with_conversion, "count", lang) },
              ],
            }))}
          />
        </div>
        <div className="ov-trends">
          {["compliance_rate", "regenerative_adoption_share", "emissions_intensity"].map((k) => {
            const t = trends[k];
            const first = t.points[0]?.y;
            const last = t.points[t.points.length - 1]?.y;
            return (
              <div key={k} className="panel trend-card">
                <div className="trend-head">
                  <span className="eyebrow">{label(t.label, lang)}{k === "compliance_rate" ? " · EUDR" : ""}</span>
                  <span className="trend-v">{fmt(last, t.unit, lang)}</span>
                </div>
                <span className="small faint">{t.points[0]?.x} {he ? "←" : "→"} {t.points[t.points.length - 1]?.x} · {he ? "בהתחלה:" : "from"} {fmt(first, t.unit, lang)}</span>
                <Spark points={t.points} unit={t.unit} lang={lang} color={k === "emissions_intensity" ? "var(--series-3)" : "var(--series-1)"} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
