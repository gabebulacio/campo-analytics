"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { label } from "@/lib/format";

export default function Metrics() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<any>(null);
  const [q, setQ] = useState("");
  useEffect(() => {
    api.catalog().then(setCat).catch(() => setCat({ error: true }));
  }, []);
  const filtered = useMemo(() => {
    if (!cat?.metrics) return [];
    const s = q.toLowerCase();
    return cat.metrics.filter((m: any) => !s || [m.name, m.label.en, m.label.he, m.description, ...(m.synonyms || [])].join(" ").toLowerCase().includes(s));
  }, [cat, q]);
  if (!cat) return <div className="page"><div className="bar" /></div>;
  if (cat.error) return <div className="page"><div className="callout bad">{t("error")}</div></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{lang === "he" ? "שכבה סמנטית" : "Semantic layer"} · {cat.name} · {cat.version}</div>
          <h1>{t("metrics")}</h1>
          <p className="lede">{lang === "he" ? "מקור האמת היחיד של ה-planner. הוספת מדד היא עריכה של ה-YAML, בלי לגעת בקוד." : "The planner's single source of truth. Adding a metric means editing YAML, no code changes."}</p>
        </div>
        <input className="search" placeholder={lang === "he" ? "חיפוש מדדים או מילים נרדפות" : "Search metrics or synonyms"} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {cat.workspaces.map((w: any) => {
        const ms = filtered.filter((m: any) => m.workspace === w.id);
        if (!ms.length) return null;
        return (
          <section key={w.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <h2>{label(w.label, lang)}</h2>
              <p className="muted small">{w.description}</p>
            </div>
            <div className="panel table-wrap" style={{ maxHeight: "none" }}>
              <table className="data">
                <thead><tr><th>{lang === "he" ? "מדד" : "Metric"}</th><th className="hide-mobile">{lang === "he" ? "סוג" : "Type"}</th><th className="hide-mobile">{lang === "he" ? "יחידה" : "Unit"}</th><th className="hide-mobile">{lang === "he" ? "ממדים מותרים" : "Allowed dimensions"}</th></tr></thead>
                <tbody>
                  {ms.map((m: any) => (
                    <tr key={m.name}>
                      <td className="wide-cell" style={{ whiteSpace: "normal" }}>
                        <b>{label(m.label, lang)}</b> <span className="mono faint small">{m.name}</span>
                        <div className="small muted">{m.description}</div>
                        {m.requires_filter_or_group?.length > 0 && <span className="badge b-warn" style={{ marginTop: 4 }}>{lang === "he" ? "דורש" : "requires"}: {m.requires_filter_or_group.join(", ")}</span>}
                      </td>
                      <td className="mono small hide-mobile">{m.type}</td>
                      <td className="mono small hide-mobile">{m.unit}</td>
                      <td style={{ whiteSpace: "normal" }} className="small muted hide-mobile">{m.allowed_dimensions.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>{lang === "he" ? "שאילתות מאומתות" : "Verified queries"}</h2>
        <div className="grid-2">
          {cat.verified_queries.map((v: any) => (
            <div key={v.id} className="panel card">
              <span className="badge b-ok" style={{ alignSelf: "flex-start" }}><ShieldCheck size={13} />{t("verified")}</span>
              <b>{(v.questions[lang] || v.questions.en)[0]}</b>
              <span className="mono faint small">{v.id} · {v.owner} · {v.verified_at}</span>
            </div>
          ))}
        </div>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>{lang === "he" ? "פערים ידועים (נדחים בכוונה)" : "Known gaps (refused on purpose)"}</h2>
        <div className="grid-2">
          {cat.known_gaps.map((g: any) => (
            <div key={g.topic} className="panel card">
              <b>{g.topic}</b>
              <span className="small muted">{g.reason}</span>
              <span className="small faint">{lang === "he" ? "הכי קרוב" : "Closest"}: {g.closest.join(", ")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
