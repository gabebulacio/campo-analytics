"use client";

import { useEffect, useState } from "react";
import { Download, LayoutDashboard, RefreshCw, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { loadDashboard, saveDashboard, type DashboardSpec } from "@/lib/pins";
import type { Answer } from "@/lib/types";
import { AnswerCard } from "@/components/AnswerCard";

export default function Dashboards() {
  const { t, lang } = useI18n();
  const [spec, setSpec] = useState<DashboardSpec | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);

  async function runAll(s: DashboardSpec) {
    setBusy(true);
    const out: Record<string, Answer> = {};
    await Promise.all(
      s.tiles.map(async (tile) => {
        try {
          out[tile.id] = await api.ask({ question: tile.question, clarification: tile.clarification ?? undefined, lang });
        } catch {}
      }),
    );
    setAnswers(out);
    setBusy(false);
  }

  useEffect(() => {
    const s = loadDashboard();
    setSpec(s);
    runAll(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!spec) return null;
  const remove = (id: string) => {
    const s = { ...spec, tiles: spec.tiles.filter((x) => x.id !== id) };
    saveDashboard(s);
    setSpec(s);
  };
  const exportSpec = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "dashboard.json";
    a.click();
  };
  const importSpec = (file: File) =>
    file.text().then((txt) => {
      const s = JSON.parse(txt) as DashboardSpec;
      saveDashboard(s);
      setSpec(s);
      runAll(s);
    });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{t("dashboards")}</div>
          <h1>{spec.name}</h1>
          <p className="lede">{lang === "es" ? "Cada tarjeta guarda la pregunta y su plan, no los datos: al abrir el tablero se vuelve a ejecutar contra la capa semántica." : "Each tile stores the question and its plan, not the data: opening the dashboard re-runs it against the semantic layer."}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => runAll(spec)} disabled={busy}><RefreshCw size={14} /> {t("rerun")}</button>
          <button className="btn" onClick={exportSpec}><Download size={14} /> JSON</button>
          <label className="btn" style={{ cursor: "pointer" }}>
            <Upload size={14} /> {lang === "es" ? "Importar" : "Import"}
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importSpec(e.target.files[0])} />
          </label>
        </div>
      </div>
      {spec.tiles.length === 0 ? (
        <div className="panel empty"><LayoutDashboard size={24} /><b>{t("emptyDash")}</b></div>
      ) : (
        <div className="grid-2">
          {spec.tiles.map((tile) => (
            <div key={tile.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {answers[tile.id] ? <AnswerCard answer={answers[tile.id]} onAsk={() => {}} compact /> : <div className="panel answer"><div className="bar" /><div className="bar" style={{ width: "60%" }} /></div>}
              <button className="btn ghost sm" style={{ alignSelf: "flex-end" }} onClick={() => remove(tile.id)}><Trash2 size={14} /> {t("remove")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
