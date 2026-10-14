// Building blocks for the architecture diagrams (styled by `.diagram` in globals.css).
// cls: "" (plain) | "det" (deterministic) | "ai" | "ok" (trust / control) | "data"

export function Box({ x, y, w, h, cls, title, sub }: { x: number; y: number; w: number; h: number; cls: string; title: string; sub?: string }) {
  return (
    <g>
      <rect className={`box ${cls}`} x={x} y={y} width={w} height={h} rx={8} />
      <text className="t" x={x + 12} y={y + 22}>{title}</text>
      {sub && sub.split("\n").map((line, i) => <text key={i} className="s" x={x + 12} y={y + 40 + i * 15}>{line}</text>)}
    </g>
  );
}

/** Arrowhead marker; reference it with markerEnd={`url(#${id})`}. */
export function ArrowDefs({ id = "ah" }: { id?: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" className="ah" />
      </marker>
    </defs>
  );
}
