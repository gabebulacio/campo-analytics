"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, BarChart3, BookOpen, FlaskConical, LayoutDashboard, Monitor, Moon, Sprout, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

type Theme = "system" | "light" | "dark";

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const path = usePathname();
  const [theme, setTheme] = useState<Theme>("system");
  const [health, setHealth] = useState<{ ok: boolean; llm: boolean; engine: string; version: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved) setTheme(saved);
    } catch {}
    api.health().then((h) => setHealth({ ok: h.status === "ok", llm: h.llm_configured, engine: h.engine, version: h.semantic_version })).catch(() => setHealth({ ok: false, llm: false, engine: "-", version: "-" }));
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const nav = [
    { href: "/", label: t("ask"), icon: <BarChart3 size={16} /> },
    { href: "/dashboards", label: t("dashboards"), icon: <LayoutDashboard size={16} /> },
    { href: "/metrics", label: t("metrics"), icon: <BookOpen size={16} /> },
    { href: "/evals", label: t("evals"), icon: <FlaskConical size={16} /> },
    { href: "/traces", label: t("traces"), icon: <Activity size={16} /> },
  ];
  const next: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark"><Sprout size={14} /></span>
          Campo Analytics
          <span className="badge b-neutral hide-sm">demo</span>
        </Link>
        <div className="spacer" />
        <div className="seg" role="group" aria-label="Language">
          <button aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
          <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
        </div>
        <button className="icon-btn" onClick={() => setTheme(next[theme])} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
          <ThemeIcon size={16} />
        </button>
      </header>
      <nav className="sidebar" aria-label="Main">
        {nav.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href) || (n.href === "/traces" && path.startsWith("/trace"));
          return (
            <Link key={n.href} href={n.href} className="nav-item" aria-current={active ? "page" : undefined}>
              {n.icon}
              {n.label}
            </Link>
          );
        })}
        <div className="foot">
          {health ? (
            <>
              <div><span className={`status-dot ${health.ok ? "" : "off"}`} />{health.ok ? `pipeline · ${health.engine}` : "pipeline offline"}</div>
              <div><span className={`status-dot ${health.llm ? "" : "off"}`} />{health.llm ? "LLM planner on" : "LLM off (verified only)"}</div>
              <div className="mono">semantic {health.version}</div>
            </>
          ) : (
            "…"
          )}
        </div>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
