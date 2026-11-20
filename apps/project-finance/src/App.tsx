import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProjectDetail, Snapshot, Viewer, ViewId } from "./types";
import { TrustStrip } from "./components/TrustStrip";
import { AccountView, BriefView, HealthView, PortfolioView, QueueView } from "./components/views";
import { Home, type Choice } from "./components/Home";
import { LibraryView, type ViewMeta } from "./components/Library";
import { RequestsView } from "./components/Requests";
import { GlossaryView } from "./components/Glossary";
import { PitchView } from "./components/Pitch";
import { CaseStudyView } from "./components/CaseStudy";
import { setPortfolios } from "./components/RequestForm";
import { ExportMenu, type ExportFormat } from "./components/ExportMenu";
import { Info } from "./components/Info";
import { toCsv, toPdf, toPptx, toXlsx, type Bundle, type ExportMeta } from "./export";
import { accountBundle, briefBundle, caseBundle, glossaryBundle, healthBundle, libraryBundle, portfolioBundle, queueBundle, requestsBundle } from "./bundles";
import { monthLabel } from "./format";
import { loadDetail, loadIndex, loadSnapshot } from "./data";
import { PLANTED_FALLBACK } from "./planted";

/** Reports per audience. The first is the default for that role. */
const VIEWS_BY_ROLE: Record<string, ViewId[]> = {
  "Platform owner": ["health", "queue", "account", "portfolio", "brief"],
  CFA: ["queue", "account", "brief"],
  CFM: ["account", "queue", "portfolio", "brief", "health"],
  Director: ["portfolio", "account", "brief"],
  "Group Director": ["portfolio", "account", "brief"],
  AD: ["brief"],
};
const ALWAYS: ViewId[] = ["library", "requests", "glossary", "pitch", "case"];

const PAGES: Record<ViewId, { label: string; desc: string; who: string; icon: ReactNode }> = {
  queue: { label: "My work queue", desc: "What to fix this week, most urgent first, with the request that fixes each item.", who: "CFAs and CFMs", icon: <path d="M3 4h10M3 8h10M3 12h6" /> },
  account: { label: "Account position", desc: "Where each SOW stands: budget, spend, progress and billing.", who: "CFMs and finance directors", icon: <path d="M3 13V8M8 13V3M13 13V6" /> },
  portfolio: { label: "Portfolio", desc: "Where the money is, and where the risk is concentrated.", who: "Directors and Group Directors", icon: <><circle cx="8" cy="8" r="5.5" /><path d="M8 2.5V8h5.5" /></> },
  brief: { label: "Project brief", desc: "One project: budget left, pace, open CTAs and every field from the source files.", who: "Account directors, PMs and CFAs", icon: <><rect x="3" y="2.5" width="10" height="11" rx="1" /><path d="M5.5 6h5M5.5 9h5" /></> },
  health: { label: "Data health", desc: "Is the data fresh, complete and reconciled? Who is unassigned?", who: "Finance ops", icon: <path d="M2 8h3l1.5-4 3 8L11 8h3" /> },
  library: { label: "Report library", desc: "Every report and source file: where it lives, what it holds, and downloads in Excel, CSV, PowerPoint or PDF.", who: "Everyone", icon: <><path d="M2.5 3.5h4l1.5 1.5h5.5v7.5h-11z" /></> },
  requests: { label: "Raise a request", desc: "Where to ask the request desk for a fix, and which request type fixes which CTA.", who: "Everyone", icon: <><path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" /></> },
  glossary: { label: "Glossary", desc: "What every figure means, how it's worked out, and how the checks are tested.", who: "Everyone", icon: <><path d="M4 2.5h7.5v11H4a1.5 1.5 0 0 1 0-3h7.5" /></> },
  case: { label: "Case study", desc: "What went into the platform: the problem, the checks, and every decision with its reason and trade-off. Every source document opens in the app.", who: "Everyone", icon: <><path d="M3 2.5h7l3 3v8H3z" /><path d="M5.5 8h5M5.5 10.5h5M5.5 5.5h2.5" /></> },
  pitch: { label: "About this platform", desc: "The pitch: what this replaces, how it works and what it would need next.", who: "Everyone", icon: <><path d="M8 2.5 13.5 5 8 7.5 2.5 5z" /><path d="M4.5 6v3.5c1 1.5 6 1.5 7 0V6" /></> },
};
const ANSWERS: Partial<Record<ViewId, string>> = {
  queue: "What do I fix today, and for whom?",
  account: "Where does each SOW stand: budget, spend, progress, billing?",
  portfolio: "Where is the portfolio against plan, and where is the risk concentrated?",
  brief: "How much budget is left, are we on pace, what is blocking billing?",
  health: "Is the data fresh and complete; who is unassigned?",
};

const params = new URLSearchParams(window.location.search);
const STORE = "pf.choice";
const readChoice = (): Choice | null => { try { return JSON.parse(localStorage.getItem(STORE) ?? "null"); } catch { return null; } };
const writeChoice = (c: Choice) => { try { localStorage.setItem(STORE, JSON.stringify(c)); } catch { /* private mode: fine */ } };

export default function App() {
  const [viewers, setViewers] = useState<Viewer[] | null>(null);
  const [entered, setEntered] = useState(params.has("viewer"));
  const [viewerKey, setViewerKey] = useState(params.get("viewer") ?? "all");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>("health");
  const [scopeClient, setClient] = useState("all");
  const client = scopeClient;
  const [product, setProduct] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("light");
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [pendingClient, setPendingClient] = useState<string | null>(null);

  useEffect(() => {
    loadIndex<{ viewers: Viewer[] }>().then((i) => setViewers(i.viewers)).catch((e) => setError(String(e)));
  }, []);
  useEffect(() => {
    if (!entered) return;
    const v = viewers?.find((x) => x.key === viewerKey);
    if (!v) return;
    setSnap(null);
    loadSnapshot(v.file).then((s) => {
      setSnap(s);
      setPortfolios(s.projects);
      const wanted = params.get("view") as ViewId | null;
      const allowedViews = [...(VIEWS_BY_ROLE[v.role] ?? ["account"]), ...ALWAYS];
      setView(wanted && allowedViews.includes(wanted) ? wanted : allowedViews[0]);
      setClient(pendingClient ?? "all"); setPendingClient(null); setProduct("all"); setSelected(null);
    }).catch((e) => setError(String(e)));
  }, [viewers, viewerKey, entered]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    const h = (e: Event) => setDetail((e as CustomEvent).detail);
    window.addEventListener("pf:detail", h);
    return () => window.removeEventListener("pf:detail", h);
  }, []);
  useEffect(() => { setNavOpen(false); window.scrollTo(0, 0); }, [view]);

  const scoped = useMemo(() => {
    if (!snap) return null;
    const projects = snap.projects.filter((p) => (client === "all" || p.client_name === client) && (product === "all" || p.product === product));
    const ids = new Set(projects.map((p) => p.id));
    const catalog = (snap.catalog ?? []).filter((c) => client === "all" || c.clients.includes(client));
    return { projects, exceptions: snap.exceptions.filter((e) => ids.has(e.project_id)), catalog };
  }, [snap, client, product]);

  if (!entered) {
    if (error) return <div className="boot card">The synthetic data isn't in this build: {error}.</div>;
    if (!viewers) return <div className="boot muted">Loading…</div>;
    return <Home viewers={viewers} last={readChoice()} onEnter={(c) => { writeChoice(c); setPendingClient(c.client); setViewerKey(c.viewerKey); setEntered(true); }} />;
  }

  const viewer = viewers?.find((v) => v.key === viewerKey);
  const allowed = [...(VIEWS_BY_ROLE[viewer?.role ?? "CFA"] ?? ["account"]), ...ALWAYS];
  const reports = allowed.filter((v) => !ALWAYS.includes(v));
  const clients = snap ? [...new Set(snap.projects.map((p) => p.client_name))].sort() : [];
  const products = snap ? [...new Set(snap.projects.filter((p) => client === "all" || p.client_name === client).map((p) => p.product))].sort() : [];
  const open = (id: string) => { setSelected(id); if (allowed.includes("brief")) setView("brief"); };
  const page = PAGES[view];
  const viewerFile = viewer?.file.replace(/\.json$/, "") ?? "all";
  const pocMonth = snap ? Number(snap.meta.pocMonth.slice(5, 7)) : 9;

  const meta = (): ExportMeta => ({
    viewer: snap!.meta.viewer.name, role: snap!.meta.viewer.role, asOf: snap!.meta.asOf, pocMonth: snap!.meta.pocMonth,
    scope: [(client === "all" ? "All clients" : client), product === "all" ? "" : product].filter(Boolean).join(" · "),
  });
  const bundleFor = async (v: ViewId): Promise<Bundle | null> => {
    if (!snap || !scoped) return null;
    const { projects, exceptions, catalog } = scoped;
    switch (v) {
      case "queue": return queueBundle(projects, exceptions);
      case "account": return accountBundle(projects, exceptions);
      case "portfolio": return portfolioBundle(projects, exceptions);
      case "health": return snap.health ? healthBundle(snap.health, projects) : null;
      case "library": return libraryBundle(catalog);
      case "requests": return requestsBundle();
      case "glossary": return glossaryBundle(snap.planted ?? PLANTED_FALLBACK);
      case "case": return caseBundle();
      case "brief": {
        const p = projects.find((x) => x.id === selected) ?? [...projects].sort((a, b) => b.committed - a.committed)[0];
        if (!p) return null;
        const d = view === "brief" && detail ? detail
          : await loadDetail(viewerFile, p.id, viewer?.role).catch(() => null);
        return briefBundle(p, exceptions, d);
      }
      default: return null;
    }
  };
  const download = async (v: ViewId, f: ExportFormat) => {
    if (f === "pdf") {
      if (v !== view) { setView(v); setTimeout(toPdf, 600); } else toPdf();
      return;
    }
    setBusy(true);
    try {
      const b = await bundleFor(v);
      if (!b) return;
      if (f === "xlsx") await toXlsx(b, meta());
      else if (f === "csv") toCsv(b, meta());
      else if (f === "pptx") await toPptx(b, meta());
    } finally {
      setBusy(false);
    }
  };
  const libraryViews: ViewMeta[] = reports.map((id) => ({ id, label: PAGES[id].label, who: PAGES[id].who, answers: ANSWERS[id] ?? PAGES[id].desc }));
  const navItem = (v: ViewId) => (
    <li key={v}>
      <button className="nav-item" aria-current={view === v ? "page" : undefined} onClick={() => setView(v)}>
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{PAGES[v].icon}</svg>
        {PAGES[v].label}
      </button>
    </li>
  );

  return (
    <div className={"shell" + (navOpen ? " nav-open" : "")}>
      <nav className="side" aria-label="Main">
        <div className="side-top">
          <span className="side-brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 13V8M8 13V3M13 13V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>Project Finance Checks</span>
          <button className="nav-toggle" aria-expanded={navOpen} aria-label="Menu" onClick={() => setNavOpen((o) => !o)}>
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" /></svg>
          </button>
        </div>
        <div className="side-body">
          {viewer && (
            <div className="who">
              <span className="who-label">Viewing as</span>
              <strong>{viewer.name}</strong>
              <span className="who-role">{viewer.role} · {viewer.projects.toLocaleString("en-US")} projects</span>
              <button className="who-change" onClick={() => { setEntered(false); setSnap(null); window.history.replaceState(null, "", window.location.pathname); }}>Change</button>
            </div>
          )}
          <p className="nav-group">Reports</p>
          <ul className="nav">{reports.map(navItem)}</ul>
          <p className="nav-group">Find and fix</p>
          <ul className="nav">{(["library", "requests", "glossary"] as ViewId[]).map(navItem)}</ul>
          <p className="nav-group">About</p>
          <ul className="nav">{navItem("pitch")}{navItem("case")}</ul>
        </div>
        <div className="side-foot">
          <span className="badge-dark">Synthetic data</span>
          <button className="theme-btn" onClick={() => setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "auto" : "light"))}>Theme: {theme}</button>
        </div>
      </nav>

      <div className="main">
        <header className="pagehead">
          <div className="pagehead-title">
            <p className="eyebrow">{viewer?.role === "Platform owner" ? "Finance ops" : viewer?.role} · {client === "all" ? "All clients" : client}</p>
            <h1>{page.label}</h1>
            <p className="desc">{page.desc}</p>
          </div>
          {snap && view !== "pitch" && (
            <div className="pagehead-tools">
              {!["requests", "glossary", "case"].includes(view) && (
                <div className="filters" role="group" aria-label="Filters">
                  <label>Client<select value={client} onChange={(e) => { setClient(e.target.value); setProduct("all"); }}>
                    <option value="all">All clients ({clients.length})</option>{clients.map((c) => <option key={c}>{c}</option>)}</select></label>
                  {view !== "library" && <label>Product<select value={product} onChange={(e) => setProduct(e.target.value)}>
                    <option value="all">All products</option>{products.map((c) => <option key={c}>{c}</option>)}</select></label>}
                </div>
              )}
              {!(view === "health" && !snap.health) && <ExportMenu busy={busy} onPick={(f) => download(view, f)} />}
            </div>
          )}
        </header>
        <main className="content">
          {error && <div className="card">The synthetic data isn't in this build: {error}.</div>}
          {!error && (!snap || !scoped) && <div className="muted">Loading…</div>}
          {snap && scoped && (
            <>
              {!["pitch", "glossary", "case"].includes(view) && <TrustStrip snap={snap} health={snap.health} />}
              {view === "queue" && <QueueView projects={scoped.projects} exceptions={scoped.exceptions} onOpen={open} />}
              {view === "account" && <AccountView projects={scoped.projects} exceptions={scoped.exceptions} onOpen={open} pocLabel={monthLabel(pocMonth)} />}
              {view === "portfolio" && <PortfolioView projects={scoped.projects} exceptions={scoped.exceptions}
                onClient={(c) => { setClient(c); setView(allowed.includes("account") ? "account" : view); }} />}
              {view === "brief" && <BriefView projects={scoped.projects} exceptions={scoped.exceptions} selected={selected} onSelect={setSelected}
                asOfMonth={Number(snap.meta.asOf.slice(5, 7))} viewerFile={viewerFile} role={viewer?.role} catalog={snap.catalog ?? []} />}
              {view === "health" && <HealthView health={snap.health} projects={scoped.projects} />}
              {view === "library" && <LibraryView views={libraryViews} catalog={scoped.catalog} onOpen={setView} onDownload={download} isOwner={viewer?.role === "Platform owner"} />}
              {view === "requests" && <RequestsView exceptions={scoped.exceptions} />}
              {view === "glossary" && <GlossaryView planted={snap.planted ?? PLANTED_FALLBACK} />}
              {view === "pitch" && <PitchView />}
              {view === "case" && <CaseStudyView />}
            </>
          )}
          <footer className="foot">
            <span>Project Finance Checks · synthetic data, rebuilt from a platform built for an employer</span>
            <span>Figures are as of the extract date, not live<Info term="as_of" /></span>
          </footer>
        </main>
      </div>
    </div>
  );
}
