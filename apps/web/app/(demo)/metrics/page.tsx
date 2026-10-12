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
    return cat.metrics.filter((m: any) => !s || [m.name, m.label.es, m.label.en, m.description, ...(m.synonyms || [])].join(" ").toLowerCase().includes(s));
  }, [cat, q]);
  if (!cat) return <div className="page"><div className="bar" /></div>;
  if (cat.error) return <div className="page"><div className="callout bad">{t("error")}</div></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{lang === "es" ? "Capa semántica" : "Semantic layer"} · {cat.name} · {cat.version}</div>
          <h1>{t("metrics")}</h1>
          <p className="lede">{lang === "es" ? "La única fuente de verdad del planificador. Agregar una métrica es editar el YAML, sin tocar código." : "The planner's single source of truth. Adding a metric means editing YAML, no code changes."}</p>
        </div>
        <input className="search" placeholder={lang === "es" ? "Buscar métricas o sinónimos" : "Search metrics or synonyms"} value={q} onChange={(e) => setQ(e.target.value)} />
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
                <thead><tr><th>{lang === "es" ? "Métrica" : "Metric"}</th><th>{lang === "es" ? "Tipo" : "Type"}</th><th>{lang === "es" ? "Unidad" : "Unit"}</th><th>{lang === "es" ? "Dimensiones permitidas" : "Allowed dimensions"}</th></tr></thead>
                <tbody>
                  {ms.map((m: any) => (
                    <tr key={m.name}>
                      <td style={{ whiteSpace: "normal", minWidth: 280 }}>
                        <b>{label(m.label, lang)}</b> <span className="mono faint small">{m.name}</span>
                        <div className="small muted">{m.description}</div>
                        {m.requires_filter_or_group?.length > 0 && <span className="badge b-warn" style={{ marginTop: 4 }}>{lang === "es" ? "requiere" : "requires"}: {m.requires_filter_or_group.join(", ")}</span>}
                      </td>
                      <td className="mono small">{m.type}</td>
                      <td className="mono small">{m.unit}</td>
                      <td style={{ whiteSpace: "normal" }} className="small muted">{m.allowed_dimensions.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>{lang === "es" ? "Consultas verificadas" : "Verified queries"}</h2>
        <div className="grid-2">
          {cat.verified_queries.map((v: any) => (
            <div key={v.id} className="panel card">
              <span className="badge b-ok" style={{ alignSelf: "flex-start" }}><ShieldCheck size={13} />{t("verified")}</span>
              <b>{(v.questions[lang] || v.questions.es)[0]}</b>
              <span className="mono faint small">{v.id} · {v.owner} · {v.verified_at}</span>
            </div>
          ))}
        </div>
      </section>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2>{lang === "es" ? "Brechas conocidas (se rechazan a propósito)" : "Known gaps (refused on purpose)"}</h2>
        <div className="grid-2">
          {cat.known_gaps.map((g: any) => (
            <div key={g.topic} className="panel card">
              <b>{g.topic}</b>
              <span className="small muted">{g.reason}</span>
              <span className="small faint">{lang === "es" ? "Lo más cercano" : "Closest"}: {g.closest.join(", ")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
