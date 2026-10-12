import type { Lang } from "./types";

const locale = (l: Lang) => (l === "es" ? "es-AR" : "en-US");

export function fmt(v: unknown, unit: string | undefined, lang: Lang, compact = false): string {
  if (v === null || v === undefined || v === "") return "–";
  if (typeof v !== "number") return String(v);
  const nf = (o: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale(lang), o).format(v);
  if (unit === "ratio") return new Intl.NumberFormat(locale(lang), { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v);
  if (unit === "count") return nf({ maximumFractionDigits: 0, notation: compact && Math.abs(v) >= 10000 ? "compact" : "standard" });
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const s = nf({ maximumFractionDigits: digits, notation: compact && abs >= 100000 ? "compact" : "standard" });
  const suffix: Record<string, string> = { ha: " ha", t: " t", tCO2e: " tCO₂e", "kgCO2e/t": " kgCO₂e/t", hours: " h", days: lang === "es" ? " días" : " days", USD: "" };
  if (unit === "USD") return (lang === "es" ? "US$ " : "$") + s;
  return s + (unit ? suffix[unit] ?? ` ${unit}` : "");
}

export function label(l: Record<Lang, string> | undefined, lang: Lang, fallback = ""): string {
  return (l && (l[lang] || l.es || l.en)) || fallback;
}
