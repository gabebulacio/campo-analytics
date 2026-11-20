import { GLOSSARY } from "./glossary";
import { EXPORT_FONT, PALETTE as C } from "./palette";

/**
 * Downloads for every page. A page describes itself once as a Bundle (headline figures + tables);
 * each format renders that same bundle, so Excel, CSV and PowerPoint never disagree with the screen.
 */
export type Fmt = "usd" | "pct" | "int" | "num" | "text" | "date";
export interface Col<T> { label: string; get: (r: T) => string | number | null | undefined; fmt?: Fmt; width?: number }
export interface Sheet<T = any> { name: string; title?: string; columns: Col<T>[]; rows: T[] }
export interface Bundle { title: string; subtitle?: string; kpis?: { label: string; value: string; foot?: string }[]; sheets: Sheet[]; notes?: string[] }
export interface ExportMeta { viewer: string; role: string; asOf: string; pocMonth: string; scope: string }

const INK = C.ink, ACCENT = C.accentStrong, GREY = C.ink2, HAIR = C.line, FONT = EXPORT_FONT;

const stamp = () => new Date().toISOString().slice(0, 10);
const fileBase = (b: Bundle, m: ExportMeta) => `${b.title} - ${m.scope} - ${stamp()}`.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function text(v: unknown, fmt?: Fmt): string {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    if (fmt === "usd") return usd0.format(v).replace("-", "−");
    if (fmt === "pct") return `${(v * 100).toFixed(0)}%`;
    if (fmt === "int") return v.toLocaleString("en-US");
  }
  return String(v);
}

// ------------------------------------------------------------------ CSV (first table)
/** The CSV text of one table, with a BOM so Excel reads it as UTF-8. */
export function csvText(b: Bundle, sheetIndex = 0): string {
  const s = b.sheets[sheetIndex];
  const esc = (v: unknown) => { const x = v == null ? "" : String(v); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
  const lines = [s.columns.map((c) => esc(c.label)).join(","), ...s.rows.map((r) => s.columns.map((c) => esc(c.get(r))).join(","))];
  return "﻿" + lines.join("\r\n");
}

export function toCsv(b: Bundle, m: ExportMeta, sheetIndex = 0) {
  save(new Blob([csvText(b, sheetIndex)], { type: "text/csv;charset=utf-8" }), `${fileBase(b, m)} - ${b.sheets[sheetIndex].name}.csv`);
}

// ------------------------------------------------------------------ Excel (every table + about + definitions)
export async function toXlsx(b: Bundle, m: ExportMeta) {
  save(new Blob([await xlsxBuffer(b, m)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileBase(b, m)}.xlsx`);
}

export async function xlsxBuffer(b: Bundle, m: ExportMeta): Promise<ArrayBuffer> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Project Finance Checks";
  wb.created = new Date();
  const about = wb.addWorksheet("About");
  about.columns = [{ width: 26 }, { width: 90 }];
  about.addRow([b.title]).font = { bold: true, size: 16, color: { argb: "FF" + INK } };
  if (b.subtitle) about.addRow([b.subtitle]).font = { color: { argb: "FF" + GREY } };
  about.addRow([]);
  for (const [k, v] of [["Viewing as", `${m.viewer} (${m.role})`], ["Scope", m.scope], ["Extract as of", m.asOf], ["POC month", m.pocMonth],
    ["Exported", new Date().toLocaleString("en-US")], ["Data", "Synthetic data: clients, people, projects and amounts are generated."]]) {
    const r = about.addRow([k, v]);
    r.getCell(1).font = { bold: true, color: { argb: "FF" + INK } };
  }
  if (b.kpis?.length) {
    about.addRow([]);
    about.addRow(["Headline figures"]).font = { bold: true, color: { argb: "FF" + INK } };
    b.kpis.forEach((k) => about.addRow([k.label, `${k.value}${k.foot ? `  (${k.foot})` : ""}`]));
  }
  (b.notes ?? []).forEach((n, i) => { if (i === 0) about.addRow([]); about.addRow(["Note", n]); });

  const used = new Set<string>(["About", "Definitions"]);
  for (const s of b.sheets) {
    let name = s.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31);
    while (used.has(name)) name = name.slice(0, 28) + "_" + used.size;
    used.add(name);
    const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = s.columns.map((c) => ({ header: c.label, width: c.width ?? (c.fmt === "text" || !c.fmt ? 28 : 15) }));
    s.rows.forEach((r) => ws.addRow(s.columns.map((c) => { const v = c.get(r); return v === undefined ? null : v; })));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FF" + C.onInk } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + INK } };
    head.alignment = { vertical: "middle", wrapText: true };
    head.height = 30;
    s.columns.forEach((c, i) => {
      const col = ws.getColumn(i + 1);
      if (c.fmt === "usd") col.numFmt = '"$"#,##0;[Red]-"$"#,##0';
      else if (c.fmt === "pct") col.numFmt = "0%";
      else if (c.fmt === "int") col.numFmt = "#,##0";
      else if (c.fmt === "num") col.numFmt = "#,##0.00";
    });
    if (s.rows.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s.columns.length } };
  }

  const defs = wb.addWorksheet("Definitions", { views: [{ state: "frozen", ySplit: 1 }] });
  defs.columns = [{ header: "Term", width: 28 }, { header: "Group", width: 20 }, { header: "What it means", width: 80 }, { header: "How it's worked out", width: 60 }, { header: "Source", width: 50 }];
  Object.values(GLOSSARY).forEach((t) => defs.addRow([t.label, t.group, t.what, "how" in t ? t.how : "", "source" in t ? t.source : ""]));
  defs.getRow(1).font = { bold: true, color: { argb: "FF" + C.onInk } };
  defs.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + INK } };
  defs.getColumn(3).alignment = { wrapText: true, vertical: "top" };
  defs.getColumn(4).alignment = { wrapText: true, vertical: "top" };

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

// ------------------------------------------------------------------ PowerPoint (branded summary)
export async function toPptx(b: Bundle, m: ExportMeta) {
  save((await pptxFile(b, m, "blob")) as Blob, `${fileBase(b, m)}.pptx`);
}

/** The deck as a Blob (browser) or a Buffer (Node). */
export async function pptxFile(b: Bundle, m: ExportMeta, outputType: "blob" | "nodebuffer"): Promise<Blob | Uint8Array> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.title = b.title;
  pptx.company = "Project Finance Checks";
  const W = 13.33, M = 0.6;
  const footer = (s: any) => {
    s.addText(`Extract as of ${m.asOf} · Viewing as ${m.viewer} (${m.role}) · Synthetic data`, {
      x: M, y: 7.05, w: W - 2 * M, h: 0.3, fontSize: 9, color: GREY, fontFace: FONT });
  };
  const head = (s: any, eyebrow: string, title: string) => {
    s.background = { color: C.surface };
    s.addText(eyebrow.toUpperCase(), { x: M, y: 0.35, w: 9.5, h: 0.3, fontSize: 11, bold: true, color: ACCENT, fontFace: FONT, charSpacing: 1 });
    s.addText(title, { x: M, y: 0.65, w: 10.2, h: 0.9, fontSize: 26, bold: true, color: INK, fontFace: FONT, valign: "top", fit: "shrink" });
  };

  // Title + headline figures: a dark ink band with the key numbers.
  const s1 = pptx.addSlide();
  head(s1, `Project Finance Checks · ${m.scope}`, b.title);
  if (b.subtitle) s1.addText(b.subtitle, { x: M, y: 1.65, w: W - 2 * M, h: 0.8, fontSize: 14, color: GREY, fontFace: FONT, valign: "top" });
  const k = (b.kpis ?? []).slice(0, 4);
  if (k.length) {
    s1.addShape(pptx.ShapeType.roundRect, { x: M, y: 4.6, w: W - 2 * M, h: 2.0, fill: { color: INK }, line: { color: INK }, rectRadius: 0.08 });
    const cw = (W - 2 * M) / k.length;
    k.forEach((x, i) => {
      const cx = M + i * cw;
      s1.addText(x.value, { x: cx + 0.35, y: 4.85, w: cw - 0.5, h: 0.8, fontSize: 32, bold: true, color: C.onInk, fontFace: FONT });
      s1.addText(x.label + (x.foot ? `\n${x.foot}` : ""), { x: cx + 0.35, y: 5.65, w: cw - 0.5, h: 0.8, fontSize: 12, color: C.onInk2, fontFace: FONT, valign: "top" });
      if (i) s1.addShape(pptx.ShapeType.line, { x: cx, y: 4.95, w: 0, h: 1.3, line: { color: C.inkRule, width: 1 } });
    });
  }
  footer(s1);

  // One slide per table (first 14 rows), numbered.
  b.sheets.forEach((sh, i) => {
    const s = pptx.addSlide();
    head(s, `${String(i + 1).padStart(2, "0")}  ${sh.name}`, sh.title ?? sh.name);
    const cols = sh.columns.slice(0, 7);
    const rows = sh.rows.slice(0, 14);
    const header = cols.map((c) => ({ text: c.label, options: { bold: true, color: C.onInk, fill: { color: INK }, align: (c.fmt && c.fmt !== "text" ? "right" : "left") as any } }));
    const body = rows.map((r) => cols.map((c) => ({ text: text(c.get(r), c.fmt).slice(0, 70), options: { align: (c.fmt && c.fmt !== "text" ? "right" : "left") as any } })));
    s.addTable([header, ...body], { x: M, y: 1.65, w: W - 2 * M, fontSize: 10, fontFace: FONT, color: INK,
      border: { type: "solid", color: HAIR, pt: 0.5 }, rowH: 0.3, autoPage: false });
    if (sh.rows.length > rows.length) {
      s.addText(`Showing ${rows.length} of ${sh.rows.length.toLocaleString("en-US")} rows. The Excel download has all of them.`, {
        x: M, y: 6.7, w: W - 2 * M, h: 0.3, fontSize: 10, italic: true, color: GREY, fontFace: FONT });
    }
    footer(s);
  });
  return (await pptx.write({ outputType })) as Blob | Uint8Array;
}

// ------------------------------------------------------------------ PDF (browser print, print stylesheet hides the chrome)
export function toPdf() {
  window.print();
}
