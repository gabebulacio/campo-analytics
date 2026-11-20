import { useEffect, useRef, useState } from "react";

export type ExportFormat = "xlsx" | "csv" | "pptx" | "pdf";
export const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "xlsx", label: "Excel", hint: "Every table, an About sheet and the definitions" },
  { id: "csv", label: "CSV", hint: "The main table only" },
  { id: "pptx", label: "PowerPoint", hint: "Branded summary: headline figures and top rows" },
  { id: "pdf", label: "PDF", hint: "Prints this page as you see it (choose Save as PDF)" },
];

/** Compact inline row of format buttons (report library cards). */
export function ExportButtons({ onPick }: { onPick: (f: ExportFormat) => void }) {
  return (
    <span className="fmt-row" role="group" aria-label="Download">
      {FORMATS.map((f) => <button key={f.id} className="btn ghost" title={f.hint} onClick={() => onPick(f.id)}>{f.label}</button>)}
    </span>
  );
}

/** "Download" menu in the page header. */
export function ExportMenu({ onPick, busy }: { onPick: (f: ExportFormat) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", close); };
  }, [open]);
  return (
    <div className="menu" ref={ref}>
      <button className="btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} disabled={busy}>
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        {busy ? "Preparing…" : "Download"}
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          {FORMATS.map((f) => (
            <button key={f.id} role="menuitem" onClick={() => { setOpen(false); onPick(f.id); }}>
              <strong>{f.label}</strong><span>{f.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
