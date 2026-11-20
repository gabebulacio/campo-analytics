import { PITCH_TITLE, SLIDES, type Slide, type Stat } from "./pitch";
import { EXPORT_FONT, PALETTE as C } from "./palette";

/**
 * Builds the pitch as a .pptx in the browser (pptxgenjs, 13.33 × 7.5 in), in the site palette: ink titles,
 * numbered orange eyebrows, white content slides, a dark ink title slide and figure band.
 */
const INK = C.ink, ACC = C.accentStrong, ACC_LIGHT = C.accent, INK2 = C.ink2, TINT = C.surface2, HAIR = C.line, WHITE = C.surface;
const TONE = { critical: C.critical, serious: C.serious, warning: C.warning } as const;
const W = 13.333, H = 7.5, M = 0.6, FONT = EXPORT_FONT;

export async function buildPitch(): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = PITCH_TITLE;
  pptx.company = PITCH_TITLE;
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT };

  pptx.defineSlideMaster({
    title: "PF_CONTENT", background: { color: WHITE },
    objects: [
      { text: { text: `${PITCH_TITLE} · synthetic data`, options: { x: M, y: H - 0.45, w: 9, h: 0.3, fontSize: 9, color: INK2, fontFace: FONT, margin: 0 } } },
    ],
    slideNumber: { x: W - M - 0.5, y: H - 0.45, w: 0.5, h: 0.3, fontSize: 9, color: INK2, fontFace: FONT, align: "right" },
  });
  pptx.defineSlideMaster({
    title: "PF_DARK", background: { color: INK },
    objects: [{ text: { text: PITCH_TITLE, options: { x: M, y: 0.5, w: 6, h: 0.4, fontSize: 14, bold: true, color: WHITE, fontFace: FONT, margin: 0 } } }],
  });

  const text = (s: any, t: string, o: Record<string, unknown>) => s.addText(t, { fontFace: FONT, margin: 0, isTextBox: true, valign: "top", ...o });
  const header = (s: any, sl: { eyebrow: string; title: string; lede?: string }, ledeW = W - 2 * M, ledeH = 1.0) => {
    text(s, sl.eyebrow.toUpperCase(), { x: M, y: 0.48, w: 9.5, h: 0.3, fontSize: 12, bold: true, color: ACC, charSpacing: 1 });
    text(s, sl.title, { x: M, y: 0.85, w: 10.6, h: 1.0, fontSize: 28, bold: true, color: INK, fit: "shrink" });
    if (sl.lede) text(s, sl.lede, { x: M, y: 1.95, w: ledeW, h: ledeH, fontSize: 14, color: INK2, lineSpacingMultiple: 1.1 });
  };
  const band = (s: any, stats: Stat[], y: number, h: number, onDark = false) => {
    if (!onDark) s.addShape(pptx.ShapeType.roundRect, { x: M, y, w: W - 2 * M, h, fill: { color: INK }, line: { color: INK }, rectRadius: 0.06 });
    const cw = (W - 2 * M) / stats.length;
    stats.forEach((st, i) => {
      const x = M + i * cw;
      if (i) s.addShape(pptx.ShapeType.line, { x, y: y + 0.3, w: 0, h: h - 0.6, line: { color: C.inkRule, width: 1 } });
      text(s, st.value, { x: x + 0.3, y: y + 0.25, w: cw - 0.5, h: 0.75, fontSize: 30, bold: true, color: WHITE, fit: "shrink" });
      text(s, st.label, { x: x + 0.3, y: y + 1.0, w: cw - 0.5, h: h - 1.15, fontSize: 12, color: C.onInk2 });
    });
  };
  const note = (s: any, n?: string) => n && text(s, n, { x: M, y: H - 0.95, w: W - 2 * M, h: 0.4, fontSize: 10, italic: true, color: INK2 });

  const render: { [K in Slide["kind"]]: (s: any, sl: Extract<Slide, { kind: K }>) => void } = {
    title: (s, sl) => {
      text(s, sl.eyebrow.toUpperCase(), { x: M, y: 1.6, w: 11, h: 0.3, fontSize: 12, bold: true, color: ACC_LIGHT, charSpacing: 1 });
      text(s, sl.title, { x: M, y: 2.0, w: 11.2, h: 1.6, fontSize: 36, bold: true, color: WHITE, fit: "shrink" });
      text(s, sl.lede, { x: M, y: 3.65, w: 10.6, h: 1.2, fontSize: 15, color: C.onInk2, lineSpacingMultiple: 1.1 });
      s.addShape(pptx.ShapeType.line, { x: M, y: 5.15, w: W - 2 * M, h: 0, line: { color: C.inkRule, width: 1 } });
      band(s, sl.stats, 5.2, 1.85, true);
    },
    stats: (s, sl) => {
      header(s, sl, 4.9, 3.8);
      const cw = 3.3, ch = 1.85, x0 = W - M - 2 * cw - 0.3, y0 = 1.95;
      sl.stats.forEach((st, i) => {
        const x = x0 + (i % 2) * (cw + 0.3), y = y0 + Math.floor(i / 2) * (ch + 0.3);
        s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.06 });
        text(s, st.value, { x: x + 0.3, y: y + 0.25, w: cw - 0.6, h: 0.75, fontSize: 32, bold: true, color: INK, fit: "shrink" });
        text(s, st.label, { x: x + 0.3, y: y + 1.0, w: cw - 0.6, h: 0.75, fontSize: 13, color: INK2 });
      });
      note(s, sl.note);
    },
    flow: (s, sl) => {
      header(s, sl);
      const cw = (W - 2 * M - 0.8) / 3;
      sl.columns.forEach((c, i) => {
        const x = M + i * (cw + 0.4);
        text(s, [{ text: c.n + "  ", options: { color: ACC } }, { text: c.head.toUpperCase(), options: { color: INK } }] as any, { x, y: 3.0, w: cw, h: 0.3, fontSize: 13, bold: true, charSpacing: 1 });
        s.addShape(pptx.ShapeType.line, { x, y: 3.35, w: cw, h: 0, line: { color: INK, width: 1 } });
        c.items.forEach((it, k) => {
          const y = 3.52 + k * 1.0;
          s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: 0.9, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.05 });
          text(s, it.title, { x: x + 0.2, y: y + 0.1, w: cw - 0.4, h: 0.3, fontSize: 14, bold: true, color: INK });
          text(s, it.text, { x: x + 0.2, y: y + 0.42, w: cw - 0.4, h: 0.42, fontSize: 11.5, color: INK2 });
        });
      });
      note(s, sl.note);
    },
    cards: (s, sl) => {
      header(s, sl);
      const cw = (W - 2 * M - 0.6) / 3, ch = 1.75;
      sl.cards.forEach((c, i) => {
        const x = M + (i % 3) * (cw + 0.3), y = 3.05 + Math.floor(i / 3) * (ch + 0.25);
        s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, fill: { color: WHITE }, line: { color: HAIR, width: 1 }, rectRadius: 0.06 });
        text(s, c.tag.toUpperCase(), { x: x + 0.25, y: y + 0.22, w: cw - 0.5, h: 0.28, fontSize: 11, bold: true, color: ACC, charSpacing: 1 });
        text(s, c.title, { x: x + 0.25, y: y + 0.52, w: cw - 0.5, h: 0.4, fontSize: 18, bold: true, color: INK });
        text(s, c.text, { x: x + 0.25, y: y + 0.98, w: cw - 0.5, h: 0.65, fontSize: 13, color: INK2 });
      });
    },
    chain: (s, sl) => {
      header(s, sl);
      const n = sl.steps.length, gap = 0.42, cw = (W - 2 * M - (n - 1) * gap) / n, y = 2.95, ch = 3.3;
      sl.steps.forEach((st, i) => {
        const x = M + i * (cw + gap);
        s.addShape(pptx.ShapeType.roundRect, { x, y, w: cw, h: ch, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.06 });
        s.addShape(pptx.ShapeType.roundRect, { x: x + 0.22, y: y + 0.22, w: 0.52, h: 0.52, fill: { color: ACC }, line: { color: ACC }, rectRadius: 0.08 });
        text(s, st.glyph, { x: x + 0.22, y: y + 0.22, w: 0.52, h: 0.52, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle" });
        text(s, st.tag.toUpperCase(), { x: x + 0.22, y: y + 0.92, w: cw - 0.44, h: 0.26, fontSize: 10.5, bold: true, color: ACC, charSpacing: 1 });
        text(s, st.title, { x: x + 0.22, y: y + 1.18, w: cw - 0.44, h: 0.62, fontSize: 15, bold: true, color: INK, lineSpacingMultiple: 0.95 });
        text(s, st.text, { x: x + 0.22, y: y + 1.84, w: cw - 0.44, h: 0.8, fontSize: 11.5, color: INK2, lineSpacingMultiple: 1.05 });
        let cx = x + 0.22, cy = y + 2.66;  // format chips, sized to their label, wrapping
        (st.detail ?? []).forEach((d) => {
          const cw2 = 0.16 + d.length * 0.066;
          if (cx + cw2 > x + cw - 0.22) { cx = x + 0.22; cy += 0.27; }
          s.addShape(pptx.ShapeType.roundRect, { x: cx, y: cy, w: cw2, h: 0.22, fill: { color: WHITE }, line: { color: C.lineStrong, width: 0.75 }, rectRadius: 0.11 });
          text(s, d, { x: cx, y: cy, w: cw2, h: 0.22, fontSize: 8, bold: true, color: INK, align: "center", valign: "middle" });
          cx += cw2 + 0.06;
        });
        if (i < n - 1) s.addShape(pptx.ShapeType.line, { x: x + cw + 0.06, y: y + ch / 2, w: gap - 0.12, h: 0, line: { color: INK, width: 1.5, endArrowType: "triangle" } });
      });
      note(s, sl.note);
    },
    rows: (s, sl) => {
      header(s, sl);
      sl.rows.forEach((r, i) => {
        const y = 3.1 + i * 1.05;
        s.addShape(pptx.ShapeType.roundRect, { x: M, y, w: W - 2 * M, h: 0.88, fill: { color: TINT }, line: { color: TINT }, rectRadius: 0.06 });
        s.addShape(pptx.ShapeType.ellipse, { x: M + 0.3, y: y + 0.32, w: 0.24, h: 0.24, fill: { color: TONE[r.tone ?? "warning"] }, line: { color: TONE[r.tone ?? "warning"] } });
        text(s, r.label, { x: M + 0.7, y: y + 0.27, w: 1.6, h: 0.35, fontSize: 16, bold: true, color: INK });
        text(s, r.value, { x: M + 2.3, y: y + 0.12, w: 1.6, h: 0.6, fontSize: 32, bold: true, color: INK });
        text(s, r.text, { x: M + 4.1, y: y + 0.18, w: W - 2 * M - 4.4, h: 0.55, fontSize: 14, color: INK2, valign: "middle" });
      });
      note(s, sl.note);
    },
    steps: (s, sl) => {
      header(s, sl);
      const n = sl.steps.length, cw = (W - 2 * M) / n, y = 3.45;
      s.addShape(pptx.ShapeType.line, { x: M + 0.2, y: y + 0.2, w: W - 2 * M - cw + 0.2, h: 0, line: { color: HAIR, width: 2 } });
      sl.steps.forEach((st, i) => {
        const x = M + i * cw;
        s.addShape(pptx.ShapeType.ellipse, { x: x + 0.05, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: st.done ? INK : WHITE }, line: { color: INK, width: 2 } });
        text(s, st.when.toUpperCase(), { x, y: y + 0.55, w: cw - 0.25, h: 0.28, fontSize: 11, bold: true, color: ACC, charSpacing: 1 });
        text(s, st.title, { x, y: y + 0.88, w: cw - 0.25, h: 0.4, fontSize: 17, bold: true, color: INK });
        text(s, st.text, { x, y: y + 1.35, w: cw - 0.3, h: 1.3, fontSize: 13, color: INK2 });
      });
    },
    close: (s, sl) => {
      header(s, sl);
      const cw = (W - 2 * M - 0.8) / 3;
      sl.asks.forEach((a, i) => {
        const x = M + i * (cw + 0.4);
        text(s, String(i + 1).padStart(2, "0"), { x, y: 2.65, w: 0.6, h: 0.3, fontSize: 13, bold: true, color: ACC });
        s.addShape(pptx.ShapeType.line, { x, y: 2.98, w: cw, h: 0, line: { color: INK, width: 1 } });
        text(s, a.title, { x, y: 3.1, w: cw, h: 0.4, fontSize: 17, bold: true, color: INK });
        text(s, a.text, { x, y: 3.55, w: cw, h: 0.8, fontSize: 13, color: INK2 });
      });
      band(s, sl.stats, 4.75, 1.9);
    },
  };

  SLIDES.forEach((sl) => {
    const dark = sl.kind === "title";
    const s = pptx.addSlide({ masterName: dark ? "PF_DARK" : "PF_CONTENT" });
    (render[sl.kind] as (s: any, sl: Slide) => void)(s, sl);
  });
  await pptx.writeFile({ fileName: `${PITCH_TITLE} - pitch.pptx` });
}
