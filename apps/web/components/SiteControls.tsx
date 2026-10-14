"use client";

import { useEffect, useState } from "react";
import { Code2, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Theme = "system" | "light" | "dark";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

/** System → light → dark. The choice is saved, and layout.tsx applies it before first paint. */
export function ThemeButton() {
  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved) setTheme(saved);
    } catch {}
  }, []);
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button className="icon-btn theme-btn" onClick={() => setTheme(NEXT[theme])} aria-label={`Theme: ${theme}`} title={`Theme: ${theme}`}>
      <Icon size={16} />
    </button>
  );
}

/** EN | עב. Hebrew switches the page to right-to-left (see lib/i18n.tsx). */
export function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="seg" role="group" aria-label="Language">
      <button aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
      <button aria-pressed={lang === "he"} onClick={() => setLang("he")} lang="he">עב</button>
    </div>
  );
}

/** Link to a project's code, labelled in the current language. */
export function CodeLink({ href }: { href: string }) {
  const { lang } = useI18n();
  return (
    <a className="code-link" href={href} target="_blank" rel="noopener noreferrer" title={lang === "he" ? "הקוד ב-GitHub" : "Code on GitHub"}>
      <Code2 size={16} />
      <span className="hide-sm">{lang === "he" ? "קוד" : "Code"}</span>
    </a>
  );
}
