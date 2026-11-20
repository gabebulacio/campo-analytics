import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GLOSSARY, type Term as TermDef, type TermId } from "../glossary";

/**
 * (i) next to a figure or header: hover, focus or click shows the glossary entry. Keyboard and touch work,
 * Escape closes, and the text is linked to the button with aria-describedby.
 */
export function Info({ term, children }: { term?: TermId; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean }>({ left: 0, top: 0, above: false });
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const t: TermDef | null = term ? GLOSSARY[term] : null;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const w = 300;
    const above = r.bottom + 200 > window.innerHeight;
    setPos({ left: Math.max(8, Math.min(r.left - 12, window.innerWidth - w - 8)), top: above ? r.top - 8 : r.bottom + 8, above });
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !btn.current?.contains(e.target as Node)) { setOpen(false); setPinned(false); }
    };
    window.addEventListener("keydown", close);
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("keydown", close); window.removeEventListener("mousedown", close); window.removeEventListener("scroll", place, true); };
  }, [open]);

  return (
    <span className="info">
      <button ref={btn} type="button" className="info-btn" aria-label={t ? `What is ${t.label}?` : "More information"} aria-describedby={open ? id : undefined}
        onMouseEnter={() => { place(); setOpen(true); }} onMouseLeave={() => !pinned && setOpen(false)}
        onFocus={() => { place(); setOpen(true); }} onBlur={() => !pinned && setOpen(false)}
        onClick={(e) => { e.stopPropagation(); place(); setPinned((p) => !p); setOpen(true); }}>
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <rect x="7.3" y="7" width="1.4" height="4.6" rx=".7" fill="currentColor" /><circle cx="8" cy="4.9" r=".9" fill="currentColor" /></svg>
      </button>
      {open && (
        <span id={id} role="tooltip" className="info-pop" style={{ left: pos.left, top: pos.top, transform: pos.above ? "translateY(-100%)" : undefined }}>
          {t && <span className="info-title">{t.label}</span>}
          {t && <span className="info-what">{t.what}</span>}
          {t?.how && <span className="info-how"><b>How it's worked out</b>{t.how}</span>}
          {t?.source && <span className="info-src">Source: {t.source}</span>}
          {children}
        </span>
      )}
    </span>
  );
}

/** Label followed by its (i). */
export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  return <span className="term">{children ?? GLOSSARY[id].label}<Info term={id} /></span>;
}

export { RequestButton } from "./RequestForm";
