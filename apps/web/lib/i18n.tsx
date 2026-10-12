"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./types";

const STRINGS = {
  ask: { es: "Preguntar", en: "Ask" },
  dashboards: { es: "Tableros", en: "Dashboards" },
  metrics: { es: "Métricas", en: "Metrics" },
  evals: { es: "Evaluaciones", en: "Evals" },
  traces: { es: "Trazas", en: "Traces" },
  brief: { es: "Resumen ejecutivo", en: "Executive brief" },
  architecture: { es: "Arquitectura", en: "Architecture" },
  plan: { es: "Plan de implementación", en: "Implementation plan" },
  showMap: { es: "Ver mapa", en: "Show map" },
  showBars: { es: "Ver barras", en: "Show bars" },
  overall: { es: "Total del período filtrado", en: "Overall for the filtered period" },
  askTitle: { es: "Preguntale a tus datos", en: "Ask your data" },
  askLede: {
    es: "Cada número sale de una métrica definida en la capa semántica. La IA elige y combina; un compilador determinístico genera el SQL.",
    en: "Every number comes from a metric defined in the semantic layer. The AI chooses and combines; a deterministic compiler writes the SQL.",
  },
  placeholder: { es: "Ej.: ¿Qué porcentaje de la superficie es libre de deforestación según EUDR por país?", en: "e.g. What share of area is EUDR deforestation-free by country?" },
  suggested: { es: "Preguntas sugeridas", en: "Suggested questions" },
  all: { es: "Todas", en: "All" },
  howCalc: { es: "¿Cómo se calculó?", en: "How was this calculated?" },
  showTable: { es: "Ver tabla", en: "Show table" },
  showChart: { es: "Ver gráfico", en: "Show chart" },
  pin: { es: "Fijar en tablero", en: "Pin to dashboard" },
  pinned: { es: "Fijado", en: "Pinned" },
  verified: { es: "Verificado", en: "Verified" },
  governed: { es: "Basado en métricas definidas", en: "Governed metrics" },
  exploratory: { es: "Exploratorio — revisar", en: "Exploratory — review" },
  notAnswered: { es: "Sin respuesta", en: "Not answered" },
  needsInfo: { es: "Falta un dato", en: "Needs one detail" },
  closest: { es: "Lo más cercano que sí puedo responder", en: "The closest I can answer" },
  tryThese: { es: "Probá con", en: "Try" },
  definition: { es: "Definición", en: "Definition" },
  filters: { es: "Filtros", en: "Filters" },
  sql: { es: "SQL", en: "SQL" },
  sources: { es: "Fuentes", en: "Sources" },
  sample: { es: "Filas de muestra", en: "Sample rows" },
  copy: { es: "Copiar", en: "Copy" },
  copied: { es: "Copiado", en: "Copied" },
  wrap: { es: "Ajustar líneas", en: "Wrap lines" },
  noFilters: { es: "Sin filtros: se usan todos los datos disponibles.", en: "No filters: all available data is used." },
  groupedBy: { es: "Agrupado por", en: "Grouped by" },
  thinking: { es: "Interpretando", en: "Interpreting" },
  planning: { es: "Planificando", en: "Planning" },
  querying: { es: "Consultando", en: "Querying" },
  checking: { es: "Verificando", en: "Checking" },
  error: { es: "No se pudo conectar con el servicio. ¿Está corriendo el pipeline?", en: "Could not reach the service. Is the pipeline running?" },
  emptyDash: { es: "Todavía no fijaste respuestas. Fijá una desde Preguntar.", en: "No pinned answers yet. Pin one from Ask." },
  rerun: { es: "Volver a ejecutar", en: "Re-run" },
  remove: { es: "Quitar", en: "Remove" },
  dataNote: { es: "Capas públicas de referencia + datos sintéticos de productores. Demo independiente, sin datos reales de ninguna empresa.", en: "Public reference layers + synthetic producer data. Independent demo, no real company data." },
} satisfies Record<string, Record<Lang, string>>;

export type StringKey = keyof typeof STRINGS;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: StringKey) => string }>({
  lang: "es",
  setLang: () => {},
  t: (k) => STRINGS[k].es,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "en" || saved === "es") setLangState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
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
