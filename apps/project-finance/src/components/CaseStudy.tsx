import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { CASE_STUDY } from "../caseStudy";
import type { Block, SourceRef } from "../caseStudyTypes";
import { DOCS, hasDoc, kindOf, loadDoc, normalize, resolveLink } from "../docs";

/**
 * The case study: everything that went into the platform, each claim linked to the document it rests on.
 * Documents open in a side reader; the "All documents" tab lists every spec, research note and test result.
 */
/** Section labels may arrive numbered ("01 Context"); the page numbers them itself. */
const label = (e: string) => e.replace(/^\d+\s+/, "");

export function CaseStudyView() {
  const [tab, setTab] = useState<"case" | "docs">("case");
  const [doc, setDoc] = useState<string | null>(null);
  const [active, setActive] = useState(CASE_STUDY.sections[0]?.id);
  const cs = CASE_STUDY;

  useEffect(() => {
    if (tab !== "case") return;
    const io = new IntersectionObserver((es) => {
      const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: "-140px 0px -60% 0px" });
    cs.sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [tab, cs.sections]);

  return (
    <>
      <header className="cs-hero">
        <p className="eyebrow light">Case study · as of {cs.asOf}</p>
        <h2>{cs.title}</h2>
        <p className="cs-sub">{cs.subtitle}</p>
        <div className="cs-band">
          {cs.headline.map((h) => (
            <div key={h.label}><span className="cs-big">{h.value}</span><span>{h.label}</span>{h.source && <Src s={h.source} onOpen={setDoc} light />}</div>
          ))}
        </div>
      </header>

      <div className="subtabs cs-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "case"} onClick={() => setTab("case")}>Case study <span className="count">{cs.sections.length} sections</span></button>
        <button role="tab" aria-selected={tab === "docs"} onClick={() => setTab("docs")}>All documents <span className="count">{DOCS.length}</span></button>
      </div>

      {tab === "case" ? (
        <div className="cs-layout">
          <nav className="cs-toc" aria-label="Sections">
            <p className="nav-group dark">Contents</p>
            <ol>
              {cs.sections.map((s, k) => (
                <li key={s.id}><a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}
                  onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                  <span className="cs-num">{String(k + 1).padStart(2, "0")}</span>{label(s.eyebrow)}</a></li>
              ))}
            </ol>
          </nav>
          <article className="cs-body">
            {cs.sections.map((s, k) => (
              <section key={s.id} id={s.id} className="cs-section">
                <p className="eyebrow">{String(k + 1).padStart(2, "0")} · {label(s.eyebrow)}</p>
                <h3>{s.title}</h3>
                <p className="cs-summary">{s.summary}</p>
                {s.blocks.map((b, i) => <BlockView key={i} b={b} onOpen={setDoc} />)}
              </section>
            ))}
          </article>
        </div>
      ) : <DocsLibrary onOpen={setDoc} />}

      {doc && <DocDrawer path={doc} onClose={() => setDoc(null)} onOpen={setDoc} />}
    </>
  );
}

function Src({ s, onOpen, light }: { s: SourceRef; onOpen: (p: string) => void; light?: boolean }) {
  const cls = "src-chip" + (light ? " light" : "");
  if (s.doc && hasDoc(s.doc)) return <button className={cls} onClick={() => onOpen(normalize(s.doc!))} title={`Open ${normalize(s.doc)}`}><DocIcon />{s.label}</button>;
  if (s.url) return <a className={cls} href={s.url} target="_blank" rel="noreferrer noopener" title={s.url}><LinkIcon />{s.label}</a>;
  return <span className={cls + " plain"} title={s.doc}>{s.label}</span>;
}

function BlockView({ b, onOpen }: { b: Block; onOpen: (p: string) => void }) {
  switch (b.kind) {
    case "text": return <p className="cs-text">{b.body}</p>;
    case "bullets": return <ul className="cs-bullets">{b.items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
    case "stats": return (
      <div className="cs-stats">{b.stats.map((x) => <div key={x.label}><span className="cs-big">{x.value}</span><span>{x.label}</span>{x.source && <Src s={x.source} onOpen={onOpen} />}</div>)}</div>
    );
    case "table": return (
      <figure className="cs-table">
        {b.caption && <figcaption>{b.caption}</figcaption>}
        <div className="table-wrap"><table className="data"><thead><tr>{b.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody></table></div>
        {b.source && <Src s={b.source} onOpen={onOpen} />}
      </figure>
    );
    case "decision": return (
      <div className="cs-decision">
        <p className="cs-tag">Decision</p>
        <h4>{b.decision}</h4>
        <p><b>Why.</b> {b.why}</p>
        {b.alternatives?.length ? <p><b>Considered and not chosen.</b> {b.alternatives.join("; ")}.</p> : null}
        {b.tradeoff && <p><b>Trade-off.</b> {b.tradeoff}</p>}
        <div className="src-row">{b.evidence.map((s, i) => <Src key={i} s={s} onOpen={onOpen} />)}</div>
      </div>
    );
    case "timeline": return (
      <ol className="cs-timeline">{b.steps.map((s, i) => <li key={i} className={s.done ? "done" : ""}><i /><span className="cs-tag">{s.when}</span><strong>{s.title}</strong><span>{s.text}</span></li>)}</ol>
    );
    case "callout": return (
      <div className={"cs-callout " + b.tone}>
        <p className="cs-tag">{b.tone === "insight" ? "Insight" : b.tone === "risk" ? "Risk" : "Open question"}</p>
        <strong>{b.title}</strong><p>{b.body}</p>{b.source && <Src s={b.source} onOpen={onOpen} />}
      </div>
    );
    case "sources": return <div className="src-row wrap">{b.items.map((s, i) => <Src key={i} s={s} onOpen={onOpen} />)}</div>;
  }
}

function DocsLibrary({ onOpen }: { onOpen: (p: string) => void }) {
  const [q, setQ] = useState("");
  const groups = useMemo(() => [...new Set(DOCS.map((d) => d.group))], []);
  const list = DOCS.filter((d) => !q || `${d.path} ${d.title}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="card">
      <div className="card-head"><div><h2>Every document behind the platform</h2>
        <p className="desc">Specs, research notes, the platform spec, test results, the brand reference and the code that computes every figure, exactly as they are in the project. Select one to read it. Raw source data and worker-level files are not included.</p></div></div>
      <input className="search" placeholder="Search documents" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" style={{ maxWidth: 420 }} />
      <div className="doc-groups">
        {groups.map((g) => {
          const ds = list.filter((d) => d.group === g);
          return ds.length ? (
            <section key={g}><h3>{g}</h3>
              <ul>{ds.map((d) => <li key={d.path}><button className="doc-link" onClick={() => onOpen(d.path)}><DocIcon /><span><strong>{d.title}</strong><span className="cell-sub">{d.path}</span></span></button></li>)}</ul>
            </section>
          ) : null;
        })}
      </div>
    </div>
  );
}

function DocDrawer({ path, onClose, onOpen }: { path: string; onClose: () => void; onOpen: (p: string) => void }) {
  const [md, setMd] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMd(null); setErr(null);
    loadDoc(path).then(setMd).catch((e) => setErr(String(e)));
    body.current?.scrollTo(0, 0);
  }, [path]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const kind = kindOf(path);
  const html = useMemo(() => (md && kind === "markdown" ? (marked.parse(md, { async: false }) as string) : ""), [md, kind]);
  const click = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (!a || !href) return;
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noreferrer noopener"; return; }
    e.preventDefault();
    if (href.startsWith("#")) return;
    const target = resolveLink(path, href);
    if (hasDoc(target)) onOpen(target);
  };
  const download = () => {
    if (!md) return;
    const a = document.createElement("a");
    a.href = kind === "image" ? md : URL.createObjectURL(new Blob([md], { type: "text/plain" }));
    a.download = path.split("/").pop()!;
    a.click();
    if (kind !== "image") setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={path} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div><p className="eyebrow">Source document</p><strong className="drawer-path">{path}</strong></div>
          <div className="report-actions">
            <button className="btn ghost" onClick={download} disabled={!md}>Download file</button>
            <button className="btn" onClick={onClose} autoFocus>Close</button>
          </div>
        </div>
        <div className="drawer-body md" ref={body} onClick={click}>
          {err ? <p className="muted">{err}</p> : md == null ? <p className="muted">Loading…</p> : kind === "image" ? <img src={md} alt={path} className="doc-img" />
            : kind === "code" ? <pre className="doc-code"><code>{md}</code></pre>
            : <div dangerouslySetInnerHTML={{ __html: html }} />}
        </div>
      </aside>
    </div>
  );
}

function DocIcon() {
  return <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" style={{ flex: "none" }}><path d="M4 1.5h5.5L12.5 4.5v10h-8.5zM9.5 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function LinkIcon() {
  return <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" style={{ flex: "none" }}><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
