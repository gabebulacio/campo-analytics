import { useState } from "react";
import type { Viewer } from "../types";
import { n0 } from "../format";

/**
 * Start screen: who are you, then (optionally) which client to focus on. The choice stands in for sign-in; the
 * production design replaces it with row-level security from the signed-in identity.
 */
const ROLES: { role: string; title: string; what: string; starts: string }[] = [
  { role: "CFA", title: "Client finance analyst", what: "You keep the trackers up to date and fix job-level issues week to week.", starts: "My work queue: what to fix this week" },
  { role: "CFM", title: "Client finance manager", what: "You own month-end revenue, billing and escalations for a set of clients.", starts: "Account position: where each SOW stands" },
  { role: "Director", title: "Director", what: "You lead finance over a set of clients and need risk, not job detail.", starts: "Portfolio: where the risk sits" },
  { role: "Group Director", title: "Group Director", what: "You lead a whole portfolio and decide what to raise to leadership.", starts: "Portfolio: where the risk sits" },
  { role: "AD", title: "Account director", what: "You run delivery and need budget left and pace, without rates or margin.", starts: "Project brief: budget left and pace" },
  { role: "Platform owner", title: "Finance ops", what: "You run the data: freshness, reconciliation, coverage and who is unassigned.", starts: "Data health: is the data fresh and complete" },
];

export interface Choice { viewerKey: string; client: string }

export function Home({ viewers, last, onEnter }: { viewers: Viewer[]; last: Choice | null; onEnter: (c: Choice) => void }) {
  const [role, setRole] = useState<string | null>(null);
  const [person, setPerson] = useState<Viewer | null>(null);
  const [q, setQ] = useState("");
  const people = viewers.filter((v) => v.role === role).filter((v) => !q || `${v.name} ${v.clients.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const lastViewer = last ? viewers.find((v) => v.key === last.viewerKey) : undefined;
  const pickRole = (r: string) => {
    setRole(r); setQ("");
    const only = viewers.filter((v) => v.role === r);
    setPerson(only.length === 1 ? only[0] : null);
  };
  const step = !role ? 1 : !person ? 2 : 3;

  return (
    <div className="home">
      <aside className="home-side">
        <span className="side-brand"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 13V8M8 13V3M13 13V6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>Project Finance Checks</span>
        <div>
          <p className="eyebrow"><span className="badge synth">Synthetic data</span></p>
          <h1>Every SOW, its spend and what needs fixing, in one place.</h1>
          <p className="home-lede">Built from the ERP exports and client trackers a finance team already keeps. Pick who you are and you'll see your projects, your CTAs and your reports.</p>
          <p className="home-origin">Rebuilt from a platform Gabriel built for an employer, on synthetic data: clients, people, projects and amounts are all generated.</p>
        </div>
        <ol className="home-steps" aria-label="Steps">
          <li aria-current={step === 1 ? "step" : undefined} className={step > 1 ? "done" : ""}>Your role</li>
          <li aria-current={step === 2 ? "step" : undefined} className={step > 2 ? "done" : ""}>Your name</li>
          <li aria-current={step === 3 ? "step" : undefined}>Your focus</li>
        </ol>
        <dl className="home-key" aria-label="Terms">
          <div><dt>SOW</dt><dd>Statement of work: the agreed budget. Revised SOW is the latest approved one.</dd></div>
          <div><dt>OOP</dt><dd>Out-of-pocket: third-party costs billed on to the client.</dd></div>
          <div><dt>% complete (POC)</dt><dd>The analyst's monthly estimate of work done, which drives revenue. POC month is the month last reported.</dd></div>
          <div><dt>Fee burn</dt><dd>Labour spent ÷ labour budget. Above % complete means money goes faster than the work.</dd></div>
        </dl>
        <p className="home-note">Choosing a person here stands in for signing in. Here scope is a filter in the browser; the production design scopes access in the model.</p>
      </aside>

      <main className="home-main">
        {lastViewer && step === 1 && (
          <button className="continue" onClick={() => onEnter(last!)}>
            <span><span className="muted">Continue as</span><br /><strong>{lastViewer.name}</strong> · {lastViewer.role}{last!.client !== "all" ? ` · ${last!.client}` : ""}</span>
            <span aria-hidden="true">→</span>
          </button>
        )}

        <section className="home-step">
          <h2><span className="num-badge">01</span>Who are you?</h2>
          <div className="role-grid">
            {ROLES.filter((r) => viewers.some((v) => v.role === r.role)).map((r) => {
              const n = viewers.filter((v) => v.role === r.role).length;
              return (
                <button key={r.role} className="role-card" aria-pressed={role === r.role} onClick={() => pickRole(r.role)}>
                  <span className="role-title">{r.title}</span>
                  <span className="role-what">{r.what}</span>
                  <span className="role-starts">Starts on {r.starts}</span>
                  <span className="role-n">{r.role === "Platform owner" ? "All clients" : `${n0(n)} ${n === 1 ? "person" : "people"}`}</span>
                </button>
              );
            })}
          </div>
        </section>

        {role && role !== "Platform owner" && (
          <section className="home-step">
            <h2><span className="num-badge">02</span>Which one is you?</h2>
            <input className="search" placeholder="Search by name or client" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" autoFocus />
            <div className="people">
              {people.map((v) => (
                <button key={v.key} className="person" aria-pressed={person?.key === v.key} onClick={() => setPerson(v)}>
                  <strong>{v.name}</strong>
                  <span className="muted">{n0(v.projects)} projects · {v.clients.join(", ")}</span>
                </button>
              ))}
              {!people.length && <div className="muted">No one matches.</div>}
            </div>
          </section>
        )}

        {person && (
          <section className="home-step">
            <h2><span className="num-badge">{role === "Platform owner" ? "02" : "03"}</span>What do you want to look at?</h2>
            <p className="muted">You can change this later from the filters at the top of each page.</p>
            <div className="chips">
              <button className="chip primary" onClick={() => onEnter({ viewerKey: person.key, client: "all" })}>
                All {person.role === "Platform owner" ? "clients" : "my clients"} ({person.clients.length})
              </button>
              {person.clients.length > 1 && person.clients.map((c) => (
                <button key={c} className="chip" onClick={() => onEnter({ viewerKey: person.key, client: c })}>{c}</button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
