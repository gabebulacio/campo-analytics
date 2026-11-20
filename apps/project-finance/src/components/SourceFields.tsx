import { useEffect, useState } from "react";
import type { CatalogEntry, ProjectDetail, SourceLines } from "../types";
import { n0 } from "../format";
import { loadDetail, sourceUrl } from "../data";

/**
 * Everything the source files say about one project, untransformed: the ERP project summary row, the tracker
 * row (every non-blank column, including comments), month-by-month % complete and revenue, hours by billing role
 * level, PO lines and OOP lines. Each tab says which file and tab it came from, with a link to the original.
 */
type Tab = "summary" | "tracker" | "phasing" | "hours" | "po" | "oop";
type Field = [string, string, string | number];

const PHASING = /%\s*Complete|\bJTD\b|MTD Revenue/i;

function fmtVal(v: string | number | null, header = ""): string {
  if (v == null) return "";
  if (typeof v === "number") {
    if (/%|burn|percent/i.test(header) && Math.abs(v) <= 5 && !/variance|amount/i.test(header)) return `${(v * 100).toFixed(1).replace(/\.0$/, "")}%`;
    if (Number.isInteger(v) && Math.abs(v) < 10000 && /BU#|number|line|ID|#/i.test(header)) return String(v);
    return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return v;
}

/** Tracker month columns -> one row per reported month (the % complete header opens a row; JTD/MTD attach to it). */
function phasingRows(fields: Field[]) {
  const rows: { label: string; group: string; pct?: number | string; jtd?: number | string; mtd?: number | string; act?: number | string; togo?: number | string }[] = [];
  for (const [g, h, v] of fields.filter(([, h]) => PHASING.test(h))) {
    if (/%\s*Complete/i.test(h)) {
      rows.push({ label: h.replace(/\s*(Project\s*)?%\s*Complete/i, "").replace(/^(Reported|Actual|Forecast)\s+/i, (m) => m.trim() === "Reported" ? "" : m), group: g, pct: v });
      continue;
    }
    const r = rows[rows.length - 1] ?? (rows.push({ label: h.split(/\s|-/)[0], group: g }), rows[rows.length - 1]);
    if (/JTD/i.test(h)) r.jtd = v;
    else if (/ACTUALS/i.test(h)) r.act = v;
    else if (/TO-?GO/i.test(h)) r.togo = v;
    else r.mtd = v;
  }
  return rows;
}

function Lines({ data, empty }: { data: SourceLines; empty: string }) {
  if (!data.rows.length) return <div className="empty">{empty}</div>;
  return (
    <>
      <div className="table-wrap" style={{ maxHeight: 460, overflow: "auto" }}>
        <table className="data dense">
          <thead><tr>{data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((v, k) => <td key={k} className={typeof v === "number" ? "num" : undefined}>{fmtVal(v, data.columns[k])}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {data.total > data.rows.length && <p className="muted small">Showing the first {n0(data.rows.length)} of {n0(data.total)} lines. The Excel download of this page has the same lines; the original file has all of them.</p>}
    </>
  );
}

export function SourceFields({ projectId, viewerFile, role, catalog }: { projectId: string; viewerFile: string; role?: string; catalog: CatalogEntry[] }) {
  const [d, setD] = useState<ProjectDetail | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("summary");
  const [q, setQ] = useState("");
  useEffect(() => {
    let live = true;
    loadDetail(viewerFile, projectId, role).then((x) => live && setD(x)).catch(() => live && setD(null));
    return () => { live = false; };
  }, [projectId, viewerFile, role]);
  useEffect(() => { window.dispatchEvent(new CustomEvent("pf:detail", { detail: d ?? null })); }, [d]);

  const where = (file?: string | null) => {
    if (!file) return null;
    const norm = file.replace(/\\/g, "/");
    const e = catalog.find((c) => c.path === norm || c.name === norm.split("/").pop());
    return (
      <p className="where">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M1.5 3.5h5l1.5 1.5h6.5v8h-13z" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
        <span>From <strong>{e ? e.path : norm}</strong></span>
        {e && sourceUrl(e.id) && <a className="linkbtn" href={sourceUrl(e.id)!}>Download original</a>}
      </p>
    );
  };

  if (d === undefined) return <div className="card"><div className="muted">Loading the source fields…</div></div>;
  if (d === null) return <div className="card"><div className="muted">No source detail for this project in the synthetic extract.</div></div>;
  const trackerFields = (d.tracker?.fields ?? []) as Field[];
  const phasing = phasingRows(trackerFields);
  const other = trackerFields.filter(([, h]) => !PHASING.test(h));
  const tabs: [Tab, string, number][] = [
    ["summary", "ERP project summary", d.summary.fields.length],
    ["tracker", "Tracker row", other.length],
    ["phasing", "% complete and revenue by month", phasing.length],
    ["hours", "Hours by role level", d.hours.total],
    ["po", "PO lines", d.po.total],
    ["oop", "OOP lines", d.oop.total],
  ];
  const match = (f: Field) => !q || `${f[0]} ${f[1]} ${f[2]}`.toLowerCase().includes(q.toLowerCase());
  const grouped = (fields: Field[]) => {
    const m = new Map<string, Field[]>();
    fields.filter(match).forEach((f) => m.set(f[0] || "Job", [...(m.get(f[0] || "Job") ?? []), f]));
    return [...m.entries()];
  };

  return (
    <div className="card">
      <div className="card-head">
        <div><h2>All source fields</h2>
          <p className="desc">Every non-blank value the (synthetic) source files hold for this project, as they appear in the files. Worker, buyer and requester names are left out here.</p></div>
      </div>
      <div className="subtabs" role="tablist">
        {tabs.map(([id, label, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} disabled={!n && id !== "summary"}>
            {label} <span className="count">{n0(n)}</span>
          </button>
        ))}
      </div>
      {(tab === "summary" || tab === "tracker") && (
        <input className="search" placeholder="Filter fields" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter fields" />
      )}
      {tab === "summary" && (
        <>
          {where(d.summary.file)}
          <div className="fieldgroups">
            {grouped(d.summary.fields as Field[]).map(([g, fs]) => (
              <section key={g}><h3>{g}</h3><dl className="kv">{fs.map((f, i) => <div key={i}><dt>{f[1]}</dt><dd className={typeof f[2] === "number" ? "num" : ""}>{fmtVal(f[2], f[1])}</dd></div>)}</dl></section>
            ))}
          </div>
        </>
      )}
      {tab === "tracker" && (d.tracker ? (
        <>
          {where(d.tracker.file)}
          <p className="muted small">Tab "{d.tracker.tab}". Group names come from the tracker's merged header row.</p>
          <div className="fieldgroups">
            {grouped(other).map(([g, fs]) => (
              <section key={g}><h3>{g}</h3><dl className="kv">{fs.map((f, i) => <div key={i} className={typeof f[2] === "string" && f[2].length > 60 ? "wide" : ""}><dt>{f[1]}</dt><dd className={typeof f[2] === "number" ? "num" : ""}>{fmtVal(f[2], f[1])}</dd></div>)}</dl></section>
            ))}
          </div>
        </>
      ) : <div className="empty">This project has no row in any client tracker, so its budget comes from the ERP.</div>)}
      {tab === "phasing" && (phasing.length ? (
        <>
          {where(d.tracker?.file)}
          <div className="table-wrap" style={{ maxHeight: 460, overflow: "auto" }}>
            <table className="data dense">
              <thead><tr><th>Month</th><th>Tracker section</th><th className="num">% complete</th><th className="num">JTD revenue</th><th className="num">MTD revenue</th><th className="num">MTD actuals</th><th className="num">Month to go</th></tr></thead>
              <tbody>{phasing.map((r, i) => (
                <tr key={i}><td>{r.label}</td><td className="ink-2">{r.group}</td>
                  <td className="num">{typeof r.pct === "number" ? `${(r.pct * 100).toFixed(0)}%` : r.pct ?? ""}</td>
                  <td className="num">{fmtVal(r.jtd ?? null)}</td><td className="num">{fmtVal(r.mtd ?? null)}</td>
                  <td className="num">{fmtVal(r.act ?? null)}</td><td className="num">{fmtVal(r.togo ?? null)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </>
      ) : <div className="empty">No monthly % complete in the tracker for this project.</div>)}
      {tab === "hours" && <>{where(d.hours.file)}<Lines data={d.hours} empty="No time entries for this project in the hours exports." /></>}
      {tab === "po" && <>{where(d.po.file)}<Lines data={d.po} empty="No purchase order lines for this project in the PO exports." /></>}
      {tab === "oop" && <>{where(d.oop.file)}<Lines data={d.oop} empty="No OOP lines for this project in the OOP exports." /></>}
    </div>
  );
}
