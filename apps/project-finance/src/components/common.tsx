import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Severity } from "../types";

/** Status icon + colour; always rendered next to a text label, never alone. */
export function SeverityIcon({ severity, size = 14 }: { severity: Severity; size?: number }) {
  const color = `var(--${severity})`;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
      {severity === "critical" && (
        <>
          <circle cx="8" cy="8" r="7" fill={color} />
          <rect x="7.1" y="3.6" width="1.8" height="5.6" rx="0.9" fill="#fff" />
          <circle cx="8" cy="11.6" r="1.05" fill="#fff" />
        </>
      )}
      {severity === "serious" && <rect x="3" y="3" width="10" height="10" rx="1.5" transform="rotate(45 8 8)" fill={color} />}
      {severity === "warning" && <path d="M8 1.8 15 14.2H1z" fill={color} />}
    </svg>
  );
}

export interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

export function Tooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  const left = Math.min(tip.x + 14, window.innerWidth - 296);
  const top = Math.min(tip.y + 14, window.innerHeight - 160);
  return (
    <div className="tooltip" role="status" style={{ left, top }}>
      {tip.content}
    </div>
  );
}

export function TipRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="t-row">
      <span>{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}

/** Measures the width of its container so SVG charts can be drawn at real pixels. */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** "Nice" axis ticks for a 0..max domain. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(+v.toFixed(10));
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
}
