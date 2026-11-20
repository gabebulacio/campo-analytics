import { useMemo, useState } from "react";
import type { CatalogEntry, ViewId } from "../types";
import { dateLabel, n0 } from "../format";
import { Info } from "./Info";
import { sourceUrl } from "../data";
import { ExportButtons, type ExportFormat } from "./ExportMenu";

export interface ViewMeta { id: ViewId; label: string; who: string; answers: string }

/**
 * Report library: (1) the platform's own reports, each with downloads; (2) every source file in the extract,
 * where it sits in the folder tree, what it is, and whether the platform reads it.
 */
export function LibraryView({ views, catalog, onOpen, onDownload, isOwner }:
  { views: ViewMeta[]; catalog: CatalogEntry[]; onOpen: (v: ViewId) => void; onDownload: (v: ViewId, f: ExportFormat) => void; isOwner: boolean }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const kinds = [...new Set(catalog.map((c) => c.kind))].sort();
  const files = catalog.filter((c) => (kind === "all" || c.kind === kind)
    && (status === "all" || (status === "read" ? c.status === "read" : c.status !== "read"))
    && (!q || `${c.path} ${c.clients.join(" ")} ${c.kind}`.toLowerCase().includes(q.toLowerCase())));
  const tree = useMemo(() => {
    const m = new Map<string, Map<string, CatalogEntry[]>>();
    for (const f of files) {
      const [top, ...rest] = f.folder.split("/");
      const sub = rest.join(" / ") || "(folder root)";
      if (!m.has(top)) m.set(top, new Map());
      const s = m.get(top)!;
      s.set(sub, [...(s.get(sub) ?? []), f]);
    }
    return [...m.entries()].sort();
  }, [files]);
  const read = catalog.filter((c) => c.status === "read").length;

  return (
    <>
      <div className="card">
        <div className="card-head"><div><h2>Platform reports</h2>
          <p className="desc">Every report you can open in this scope. Download any of them without opening it: Excel has every row plus definitions, CSV has the main table, PowerPoint is a summary deck, PDF prints the page as you see it.</p></div></div>
        <div className="report-grid">
          {views.map((v) => (
            <article key={v.id} className="report-card">
              <h3>{v.label}</h3>
              <p className="rc-who">For {v.who}</p>
              <p>{v.answers}</p>
              <div className="report-actions">
                <button className="btn primary" onClick={() => onOpen(v.id)}>Open</button>
                <ExportButtons onPick={(f) => onDownload(v.id, f)} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h2>Where the data comes from<Info>
            <span className="info-what">Each file below is one export or workbook in the extract. "Read" means the platform loads it; anything else says why not. In the real platform these were links to the shared folder, opened with your own permissions. Here the files are synthetic.</span>
          </Info></h2>
            <p className="desc">{n0(catalog.length)} files in this scope, {n0(read)} read by the platform. {isOwner ? "You see every folder." : "You see the folders for your clients."} Paths are relative to the shared extract folder.</p></div>
        </div>
        <div className="toolbar">
          <input className="search" placeholder="Search file, folder or client" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search files" />
          <label>Kind<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">All kinds</option>{kinds.map((k) => <option key={k}>{k}</option>)}</select></label>
          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="read">Read by the platform</option><option value="other">Not read</option></select></label>
          <span className="muted">{n0(files.length)} shown</span>
        </div>
        {tree.map(([top, subs]) => (
          <section key={top} className="folder">
            <h3><FolderIcon />{top}</h3>
            {[...subs.entries()].sort().map(([sub, fs]) => (
              <div key={sub} className="subfolder">
                {sub !== "(folder root)" && <h4><FolderIcon />{sub}</h4>}
                <ul className="files">
                  {fs.map((f) => (
                    <li key={f.id}>
                      <div className="file-row">
                        <span className={"ext ext-" + f.ext}>{f.ext}</span>
                        <div className="file-main">
                          <button className="file-name" onClick={() => setOpen(open === f.id ? null : f.id)} aria-expanded={open === f.id}>{f.name}</button>
                          <div className="cell-sub">{f.kind}{f.as_of ? ` · as of ${dateLabel(f.as_of)}` : ""}{f.clients.length ? ` · ${f.clients.join(", ")}` : ""}</div>
                        </div>
                        <span className={"status " + (f.status === "read" ? "ok" : "no")}>{f.status === "read" ? `Read · ${n0(f.rows)} rows` : f.status}</span>
                        {sourceUrl(f.id) ? <a className="linkbtn" href={sourceUrl(f.id)!}>Download</a> : <span className="muted small-inline">Synthetic file</span>}
                      </div>
                      {open === f.id && (
                        <dl className="kv file-meta">
                          <div className="wide"><dt>Location</dt><dd>{f.path}</dd></div>
                          <div><dt>Size</dt><dd>{n0(Math.round(f.bytes / 1024))} KB</dd></div>
                          <div><dt>Projects found</dt><dd>{n0(f.projects)}</dd></div>
                          {f.tabs_read.length > 0 && <div className="wide"><dt>Tabs read</dt><dd>{f.tabs_read.join(", ")}</dd></div>}
                          {f.sheets.length > 0 && <div className="wide"><dt>All tabs</dt><dd>{f.sheets.join(" · ")}</dd></div>}
                        </dl>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
        {!files.length && <div className="empty">No files match.</div>}
      </div>
    </>
  );
}

function FolderIcon() {
  return <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ flex: "none" }}><path d="M1.5 3.5h5l1.5 1.5h6.5v8h-13z" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
