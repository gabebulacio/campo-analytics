import { useState } from "react";
import type { Health, Snapshot } from "../types";
import { dateLabel } from "../format";
import { Info } from "./Info";

/** As-of, reconciliation, period and the data label on every view. */
export function TrustStrip({ snap, health }: { snap: Snapshot; health: Health | null }) {
  const [open, setOpen] = useState(false);
  const rec = health?.reconciliation?.[0];
  const unexplained = rec ? rec.causes?.unexplained ?? 0 : null;
  return (
    <>
      <div className="trust" aria-label="Data status">
        <span className="item">Extract as of <strong>{dateLabel(snap.meta.asOf)}</strong><Info term="as_of" /></span>
        <span className="item">POC month <strong>{snap.meta.pocMonth}</strong><Info term="poc_month" /></span>
        {rec && (
          <span className="item">
            <span aria-hidden="true" className="dot" style={{ background: unexplained ? "var(--warning)" : "var(--good)" }} />
            Reconciliation <strong>{rec.actual} of {rec.of} projects differ</strong>
            <span className="muted">· {unexplained} need review</span><Info term="reconciliation" />
          </span>
        )}
        <span className="item">Period <strong>open</strong></span>
        <span className="badge synth" title="Clients, people, projects and amounts are generated">Synthetic data</span>
        {health && <button className="linkbtn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? "Hide checks" : "Show checks"}</button>}
      </div>
      {open && health && (
        <div className="card">
          {health.reconciliation.map((r) => (
            <div key={r.check}>
              <strong>{r.check}</strong>: {r.actual} of {r.of} projects differ by more than $1.{" "}
              {Object.entries(r.causes).map(([k, v]) => `${v} ${k}`).join("; ")}. <span className="muted">{r.note}</span>
            </div>
          ))}
          <div className="muted" style={{ marginTop: 6 }}>
            Tracker parse: Revised SOW {(health.parse.revised_parsed * 100).toFixed(1)}% · % complete {(health.parse.pct_parsed * 100).toFixed(0)}% of {health.parse.tracker_rows} rows.
          </div>
        </div>
      )}
    </>
  );
}
