"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./types";

const STRINGS = {
  ask: { he: "שאל", en: "Ask" },
  dashboards: { he: "דשבורדים", en: "Dashboards" },
  metrics: { he: "מדדים", en: "Metrics" },
  evals: { he: "הערכות", en: "Evals" },
  traces: { he: "Traces", en: "Traces" },
  brief: { he: "מקרה בוחן", en: "Case study" },
  architecture: { he: "ארכיטקטורה", en: "Architecture" },
  plan: { he: "תוכנית יישום", en: "Implementation plan" },
  showMap: { he: "הצג מפה", en: "Show map" },
  showBars: { he: "הצג עמודות", en: "Show bars" },
  overall: { he: "סה״כ לתקופה המסוננת", en: "Overall for the filtered period" },
  askTitle: { he: "שאלו את הנתונים שלכם", en: "Ask your data" },
  askLede: {
    he: "שאלו על ציות, פליטות או עקיבות. כל מספר מגיע ממדד מוגדר, ואפשר לראות איך הוא חושב.",
    en: "Ask about compliance, emissions or traceability. Every number comes from a defined metric, and you can see how it was calculated.",
  },
  placeholder: { he: "לדוגמה: איזה אחוז מהשטח נקי מבירוא יערות לפי EUDR, לפי מדינה?", en: "e.g. What share of area is EUDR deforestation-free by country?" },
  suggested: { he: "שאלות מוצעות", en: "Suggested questions" },
  all: { he: "הכול", en: "All" },
  howCalc: { he: "איך זה חושב?", en: "How was this calculated?" },
  showTable: { he: "הצג טבלה", en: "Show table" },
  showChart: { he: "הצג גרף", en: "Show chart" },
  pin: { he: "הצמד לדשבורד", en: "Pin to dashboard" },
  pinned: { he: "הוצמד", en: "Pinned" },
  verified: { he: "מאומת", en: "Verified" },
  governed: { he: "מבוסס על מדדים מוגדרים", en: "Governed metrics" },
  exploratory: { he: "חקרני — לבדוק", en: "Exploratory — review" },
  notAnswered: { he: "ללא תשובה", en: "Not answered" },
  needsInfo: { he: "חסר פרט אחד", en: "Needs one detail" },
  closest: { he: "הכי קרוב שאני כן יכול לענות עליו", en: "The closest I can answer" },
  tryThese: { he: "נסו", en: "Try" },
  definition: { he: "הגדרה", en: "Definition" },
  filters: { he: "מסננים", en: "Filters" },
  sql: { he: "SQL", en: "SQL" },
  sources: { he: "מקורות", en: "Sources" },
  sample: { he: "שורות לדוגמה", en: "Sample rows" },
  copy: { he: "העתק", en: "Copy" },
  copied: { he: "הועתק", en: "Copied" },
  wrap: { he: "גלישת שורות", en: "Wrap lines" },
  noFilters: { he: "בלי מסננים: נעשה שימוש בכל הנתונים הזמינים.", en: "No filters: all available data is used." },
  groupedBy: { he: "מקובץ לפי", en: "Grouped by" },
  thinking: { he: "מפרש", en: "Interpreting" },
  planning: { he: "מתכנן", en: "Planning" },
  querying: { he: "שולף", en: "Querying" },
  checking: { he: "בודק", en: "Checking" },
  error: { he: "לא ניתן להתחבר לשירות. האם ה-pipeline רץ?", en: "Could not reach the service. Is the pipeline running?" },
  emptyDash: { he: "עדיין לא הצמדת תשובות. אפשר להצמיד תשובה מתוך ״שאל״.", en: "No pinned answers yet. Pin one from Ask." },
  rerun: { he: "הרץ שוב", en: "Re-run" },
  remove: { he: "הסר", en: "Remove" },
  dataNote: { he: "שכבות ייחוס ציבוריות + נתוני יצרנים סינתטיים. דמו עצמאי, בלי נתונים אמיתיים של אף חברה.", en: "Public reference layers + synthetic producer data. Independent demo, no real company data." },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: StringKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => STRINGS[k].en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    // ?lang=he in a shared link wins over the saved choice
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "he") return setLang(fromUrl);
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "he") setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => STRINGS[k][lang] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
