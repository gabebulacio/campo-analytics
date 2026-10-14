"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Activity, BarChart3, BookOpen, FileText, FlaskConical, LayoutDashboard, Map as MapIcon, Network } from "lucide-react";
import { ProjectShell } from "@/components/ProjectShell";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { DEMO_BASE } from "@/lib/paths";

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang } = useI18n();
  const [health, setHealth] = useState<{ ok: boolean; llm: boolean; engine: string; version: string } | null>(null);

  useEffect(() => {
    api.health().then((h) => setHealth({ ok: h.status === "ok", llm: h.llm_configured, engine: h.engine, version: h.semantic_version })).catch(() => setHealth({ ok: false, llm: false, engine: "-", version: "-" }));
  }, []);

  const nav = [
    { href: "/", label: t("ask"), icon: <BarChart3 size={16} /> },
    { href: "/dashboards", label: t("dashboards"), icon: <LayoutDashboard size={16} /> },
    { href: "/metrics", label: t("metrics"), icon: <BookOpen size={16} /> },
    { href: "/evals", label: t("evals"), icon: <FlaskConical size={16} /> },
    { href: "/traces", label: t("traces"), icon: <Activity size={16} />, match: ["/trace"] },
    { href: "/case", label: t("brief"), icon: <FileText size={16} />, sep: true },
    { href: "/architecture", label: t("architecture"), icon: <Network size={16} /> },
    { href: "/plan", label: t("plan"), icon: <MapIcon size={16} /> },
  ];

  const footer = health ? (
    <>
      <div><span className={`status-dot ${health.ok ? "" : "off"}`} />{health.ok ? `pipeline · ${health.engine}` : "pipeline offline"}</div>
      <div><span className={`status-dot ${health.llm ? "" : "off"}`} />{health.llm ? "LLM planner on" : "LLM off (verified only)"}</div>
      <div className="mono">semantic {health.version}</div>
    </>
  ) : (
    "…"
  );

  return (
    <ProjectShell
      name="Campo Analytics"
      base={DEMO_BASE}
      code="https://github.com/gabebulacio/campo-analytics"
      note={lang === "he" ? "דמו פורטפוליו · נתונים סינתטיים" : "portfolio demo · synthetic data"}
      nav={nav}
      footer={footer}
    >
      {children}
    </ProjectShell>
  );
}
