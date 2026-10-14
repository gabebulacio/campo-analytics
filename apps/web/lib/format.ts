import type { Lang } from "./types";

const locale = (l: Lang) => (l === "he" ? "he-IL" : "en-US");

export function fmt(v: unknown, unit: string | undefined, lang: Lang, compact = false): string {
  if (v === null || v === undefined || v === "") return "–";
  if (typeof v !== "number") return String(v);
  const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale(lang), o).format(v);
  if (unit === "ratio") return new Intl.NumberFormat(locale(lang), { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);
  if (unit === "count") return nf({ maximumFractionDigits: 0, notation: compact && Math.abs(v) >= 10000 ? "compact" : "standard" });
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const s = nf({ maximumFractionDigits: digits, notation: compact && abs >= 100000 ? "compact" : "standard" });
  const suffix: Record<string, string> = { ha: " ha", t: " t", tCO2e: " tCO₂e", "kgCO2e/t": " kgCO₂e/t", hours: " h", days: lang === "he" ? " ימים" : " days", USD: "" };
  if (unit === "USD") return ltr("$" + s, lang);
  if (unit === "days") return s + suffix.days;
  return ltr(s + (unit ? suffix[unit] ?? ` ${unit}` : ""), lang);
}

// In Hebrew (RTL) text, "679K ha" would display as "ha 679K"; a left-to-right isolate keeps a value and its Latin unit in order.
const ltr = (s: string, lang: Lang) => (lang === "he" ? `⁦${s}⁩` : s);

export function label(l: Record<Lang, string> | undefined, lang: Lang, fallback = ""): string {
  return (l && (l[lang] || l.en || l.he)) || fallback;
}
