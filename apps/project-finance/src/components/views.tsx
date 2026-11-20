import { useMemo, useState } from "react";
import type { CatalogEntry, ExceptionRow, Health, Project, RuleId } from "../types";
import { RULES, SEV_RANK, n0, pct, pts, shortName, totals, usd, usdShort } from "../format";
import type { TermId } from "../glossary";
import { RULE_REQUESTS, exceptionText } from "../requests";
import { feeAhead, portfolioGroups, visible } from "../bundles";
import { SeverityIcon } from "./common";
import { Info, RequestButton, Term } from "./Info";
import { Bullet, DeviationBars, MonthlyColumns, PaceScatter } from "./charts";
import { SourceFields } from "./SourceFields";

function Tile({ label, value, foot, neg, term }: { label: string; value: string; foot?: string; neg?: boolean; term?: TermId }) {
  return (
    <div className="tile">
      <div className="label">{label}{term && <Info term={term} />}</div>
      <div className={"value" + (neg ? " neg" : "")}>{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  );
}

/** Column header with its (i). */
function Th({ children, term, num }: { children: React.ReactNode; term?: TermId; num?: boolean }) {
  return <th className={num ? "num" : undefined}>{children}{term && <Info term={term} />}</th>;
}

// ------------------------------------------------------------------ My work queue (CFA)
export function QueueView({ projects, exceptions, onOpen }: { projects: Project[]; exceptions: ExceptionRow[]; onOpen: (id: string) => void }) {
  const [rule, setRule] = useState<RuleId | null>(null);
  const [all, setAll] = useState(false);
  const pmap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const ex = visible(exceptions);
  const byRule = (Object.keys(RULES) as RuleId[]).filter((r) => !RULES[r].hidden).map((r) => {
    const rows = ex.filter((e) => e.rule === r);
    return { r, n: rows.length, amount: rows.reduce((a, e) => a + e.amount, 0) };
  }).filter((x) => x.n > 0).sort((a, b) => SEV_RANK[RULES[a.r].severity] - SEV_RANK[RULES[b.r].severity]);
  const rows = ex.filter((e) => !rule || e.rule === rule)
    .sort((a, b) => SEV_RANK[RULES[a.rule].severity] - SEV_RANK[RULES[b.rule].severity] || b.amount - a.amount);
  const urgent = rows.filter((e) => RULES[e.rule].severity !== "warning");
  const shown = all ? rows : (urgent.length ? urgent.slice(0, 12) : rows.slice(0, 12));
  const crit = ex.filter((e) => RULES[e.rule].severity === "critical");
  const title = ex.length
    ? `${n0(ex.length)} items to clear; ${n0(crit.length)} critical carrying ${usdShort(crit.reduce((a, e) => a + e.amount, 0))}`
    : "Nothing to clear in this scope";
  return (
    <>
      <div className="card">
        <div className="card-head"><div><h2><Term id="checks">Call to actions</Term></h2><p className="desc">Generated from rules on every load. Select one to filter the list below. Hover a CTA for its rule.</p></div>
          {rule && <button className="toggle" onClick={() => setRule(null)}>All CTAs</button>}</div>
        <ul className="rules rules-grid">
          {byRule.map(({ r, n, amount }) => (
            <li key={r}>
              <button aria-pressed={rule === r} onClick={() => setRule(rule === r ? null : r)} title={`${RULES[r].id} · ${RULES[r].why}\nNext: ${RULES[r].next}`}>
                <SeverityIcon severity={RULES[r].severity} />
                <span><span className="r-label">{RULES[r].label}</span><br /><span className="r-why">{RULES[r].why}</span></span>
                <span><div className="r-n num">{n0(n)}</div><div className="r-amt">{RULES[r].amountLabel && amount ? `${usdShort(amount)} ${RULES[r].amountLabel}` : RULES[r].id}</div></span>
              </button>
            </li>
          ))}
        </ul>
        <p className="muted small">Thresholds are placeholders until Finance confirms them. "Billed ahead" is hidden pending a rule per contract type.</p>
      </div>
      <div className="card">
        <div className="card-head">
          <div><h2>{title}</h2><p className="desc">Sorted by severity, then amount. Each row says what to do next and opens the request that fixes it, filled in. Select a row to open the project.</p></div>
          <span className="muted">{rule ? RULES[rule].label : "All CTAs"}</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><Th term="severity">Call to action</Th><th>Project</th><th className="num">Amount</th><th>Next action</th><th>Owner</th><th>Request desk</th></tr></thead>
            <tbody>
              {shown.map((e, i) => {
                const p = pmap.get(e.project_id);
                const meta = RULES[e.rule];
                return (
                  <tr key={i} onClick={() => onOpen(e.project_id)} className="clickable">
                    <td style={{ minWidth: 220 }}><span className="sev"><SeverityIcon severity={meta.severity} size={13} />{meta.label}</span><div className="cell-sub">{e.detail}</div></td>
                    <td><div className="cell-main" style={{ maxWidth: 320 }} title={p?.name}>{p ? shortName(p.name) : e.project_id}</div><div className="cell-sub">{e.project_id} · {p?.client_name}</div></td>
                    <td className="num">{e.amount ? usd(e.amount) : e.reference || "–"}</td>
                    <td style={{ minWidth: 260, maxWidth: 420 }}>{meta.next}</td>
                    <td className="ink-2" style={{ whiteSpace: "nowrap" }}>{e.owner ?? "unassigned"}<div className="cell-sub">{e.owner ? e.owner_role : "see Data health"}</div></td>
                    <td><RequestButton compact typeId={RULE_REQUESTS[e.rule][0]} text={exceptionText(RULE_REQUESTS[e.rule][0], e, p)} project={p} exception={e} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > shown.length && <button className="toggle" style={{ marginTop: 8 }} onClick={() => setAll(true)}>Show all {n0(rows.length)}</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Account position (CFM)
export function AccountView({ projects, exceptions, onOpen, pocLabel }: { projects: Project[]; exceptions: ExceptionRow[]; onOpen: (id: string) => void; pocLabel: string }) {
  const [all, setAll] = useState(false);
  const t = totals(projects);
  const flagged = new Set(exceptions.filter((e) => e.rule === "near_cap").map((e) => e.project_id));
  const withPoc = projects.filter((p) => p.pct_complete != null && p.fee_burn != null);
  const ahead = withPoc.filter((p) => p.fee_burn! - p.pct_complete! > 0.1);
  const exByP = new Map<string, number>();
  visible(exceptions).forEach((e) => exByP.set(e.project_id, (exByP.get(e.project_id) ?? 0) + 1));
  const rows = [...projects].sort((a, b) => (feeAhead(b) ?? -Infinity) - (feeAhead(a) ?? -Infinity));
  const shown = all ? rows : rows.slice(0, 40);
  return (
    <>
      <section className="tiles" aria-label="Headline figures">
        <Tile term="revised_sow" label="Revised SOW" value={usdShort(t.revised)} foot={`${n0(t.n)} projects · ${pct(t.erpBudgetShare)} use the ERP budget (no tracker line)`} />
        <Tile term="committed" label="Committed spend" value={usdShort(t.committed)} foot="Fee (incl. unapproved) + OOP + open POs" />
        <Tile term="remaining" label="Remaining" value={usdShort(t.remaining)} neg={t.remaining < 0} foot="Revised SOW − committed" />
        <Tile term="fee_burn" label="Fee burn vs complete" value={`${pct(t.feeBurnPoc)} / ${pct(t.pctPoc)}`} foot={`Projects with a reported % (${n0(withPoc.length)})`} />
        <Tile term="billing" label="Billed to date" value={usdShort(t.billing)} foot={`${usdShort(t.unbilled)} actuals not yet billed`} />
        <Tile term="mtd_revenue" label={`${pocLabel} revenue (MTD)`} value={usdShort(t.mtd)} foot={`JTD ${usdShort(t.jtd)}`} />
      </section>
      <PaceScatter projects={projects} flagged={flagged} onPick={onOpen}
        title={withPoc.length ? `Fee runs more than 10 pts ahead of delivery on ${n0(ahead.length)} of ${n0(withPoc.length)} projects` : "No reported % complete in this scope"} />
      <div className="card">
        <div className="card-head">
          <div><h2>Projects, most fee spent ahead of delivery first</h2>
            <p className="desc">Ranked by (fee burn − % complete) × revised fee. Each bar is scaled to its own row: bar = committed spend, outlined marker = revised SOW, grey tick = % complete. "ERP" = no tracker line, so the ERP budget is used.</p></div>
          <span className="muted">{n0(rows.length)} projects</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Project</th><Th num term="revised_sow">Revised SOW</Th><Th num term="committed">Committed</Th><Th num term="remaining">Remaining</Th><th>Budget vs spend</th>
              <Th num term="fee_burn">Fee burn / % done</Th><Th num term="fee_ahead">Fee ahead</Th><Th num term="mtd_revenue">{pocLabel} revenue</Th><Th num term="checks">CTAs</Th></tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} onClick={() => onOpen(p.id)} className="clickable">
                  <td><div className="cell-main" title={p.name}>{shortName(p.name)}</div><div className="cell-sub">{p.id} · {p.client_name}{p.budget_source === "erp" ? " · ERP" : ""}</div></td>
                  <td className="num">{usd(p.revised)}</td>
                  <td className="num">{usd(p.committed)}</td>
                  <td className={"num" + (p.remaining < 0 ? " neg" : "")}>{usd(p.remaining)}</td>
                  <td><Bullet p={p} max={Math.max(p.revised, p.committed) * 1.05} width={130} /></td>
                  <td className="num">{pct(p.fee_burn)} / {pct(p.pct_complete)}</td>
                  <td className="num">{feeAhead(p) != null ? <>{usdShort(feeAhead(p))}<div className="cell-sub">{pts(p.fee_burn! - p.pct_complete!)}</div></> : "–"}</td>
                  <td className="num">{usd(p.mtd_revenue)}</td>
                  <td className="num">{exByP.get(p.id) ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > shown.length && <button className="toggle" style={{ marginTop: 8 }} onClick={() => setAll(true)}>Show all {n0(rows.length)}</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Portfolio overview (Directors)
export function PortfolioView({ projects, exceptions, onClient }: { projects: Project[]; exceptions: ExceptionRow[]; onClient: (c: string) => void }) {
  const t = totals(projects);
  const { groups: clients, byClient, groupWord, riskIds } = portfolioGroups(projects, exceptions);
  const atRiskUsd = projects.filter((p) => riskIds.has(p.id)).reduce((a, p) => a + p.committed, 0);
  const ahead = projects.filter((p) => p.pct_complete != null && p.fee_burn != null && p.fee_burn - p.pct_complete > 0.1);
  const top3 = clients.slice(0, 3).reduce((a, x) => a + x.risk, 0);
  const maxScale = Math.max(...clients.map((x) => Math.max(x.ct.revised, x.ct.committed)), 1);
  const worst = clients[0];
  return (
    <>
      <section className="tiles" aria-label="Portfolio headline">
        <Tile term="revised_sow" label="Revised SOW" value={usdShort(t.revised)} foot={`${n0(t.n)} live projects · ${clients.length} ${groupWord}${clients.length === 1 ? "" : "s"}`} />
        <Tile term="committed" label="Committed spend" value={usdShort(t.committed)} foot={`Spend burn ${pct(t.burn)}`} />
        <Tile term="remaining" label="Remaining" value={usdShort(t.remaining)} neg={t.remaining < 0} />
        <Tile term="spending_ahead" label="Spending ahead of delivery" value={n0(ahead.length)} foot={`${usdShort(ahead.reduce((a, p) => a + p.fee_actuals, 0))} fee on those projects`} />
        <Tile term="at_risk" label="$ at risk" value={usdShort(atRiskUsd)} foot={!atRiskUsd ? "No projects near or over cap" : clients.length > 3 ? `${pct(top3 / atRiskUsd)} in the top 3 ${groupWord}s` : `Across ${clients.filter((x) => x.risk > 0).length} ${groupWord}${clients.length === 1 ? "" : "s"}`} />
      </section>
      <div className="card">
        <div className="card-head">
          <div><h2>{worst && worst.risk > 0 ? `${worst.c} carries the most at-risk spend: ${usdShort(worst.risk)} of ${usdShort(atRiskUsd)}` : `${byClient ? "Clients" : "Products"} by revised SOW`}</h2>
            <p className="desc">$ at risk = committed spend on projects near or over their budget cap.{byClient ? " Select a client to open its account position." : " One client in scope, so rows are products."}</p></div>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>{byClient ? "Client" : "Product"}</th><th className="num">Projects</th><Th num term="revised_sow">Revised SOW</Th><Th num term="committed">Committed</Th><th>Budget vs spend</th><Th num term="remaining">Remaining</Th><Th num term="at_risk">$ at risk</Th><Th num term="severity">Critical CTAs</Th></tr></thead>
            <tbody>
              {clients.map(({ c, ct, risk, crit }) => (
                <tr key={c} onClick={() => byClient && onClient(c)} className={byClient ? "clickable" : undefined}>
                  <td>{c}</td>
                  <td className="num">{n0(ct.n)}</td>
                  <td className="num">{usdShort(ct.revised)}</td>
                  <td className="num">{usdShort(ct.committed)}</td>
                  <td><Bullet p={{ revised: ct.revised, committed: ct.committed, pct_complete: null } as unknown as Project} max={maxScale} width={160} /></td>
                  <td className={"num" + (ct.remaining < 0 ? " neg" : "")}>{usdShort(ct.remaining)}</td>
                  <td className="num">{risk ? usdShort(risk) : "–"}</td>
                  <td className="num">{crit || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DeviationBars title={`Remaining budget by ${groupWord}`} desc="Revised SOW minus committed spend. Bars left of the line mean spend already exceeds the SOW."
        rows={clients.slice(0, 14).map((x) => ({ label: x.c, value: x.ct.remaining }))} />
    </>
  );
}

// ------------------------------------------------------------------ Project brief (AD / PM)
export function BriefView({ projects, exceptions, selected, onSelect, asOfMonth, viewerFile, role, catalog }:
  { projects: Project[]; exceptions: ExceptionRow[]; selected: string | null; onSelect: (id: string) => void; asOfMonth: number; viewerFile: string; role?: string; catalog: CatalogEntry[] }) {
  const [q, setQ] = useState("");
  const list = projects.filter((p) => !q || `${p.name} ${p.client_name} ${p.product}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.committed - a.committed);
  const p = projects.find((x) => x.id === selected) ?? list[0];
  if (!p) return <div className="card empty">No projects in this scope.</div>;
  const ex = visible(exceptions).filter((e) => e.project_id === p.id);
  const title = p.remaining < 0
    ? `${usdShort(-p.remaining)} over the revised SOW`
    : `${usdShort(p.remaining)} left of ${usdShort(p.revised)}${p.pct_complete != null ? `, ${pct(p.pct_complete)} complete` : ""}`;
  return (
    <div className="brief">
      <div className="card brief-list">
        <div className="card-head"><h2>Projects</h2><span className="muted">{n0(list.length)}</span></div>
        <input className="search" aria-label="Search projects" placeholder="Search name, client or product" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="table-wrap brief-scroll">
          <table className="data"><tbody>
            {list.slice(0, 400).map((x) => (
              <tr key={x.id} className={"clickable" + (x.id === p.id ? " sel" : "")} onClick={() => onSelect(x.id)}>
                <td><div className="cell-main">{shortName(x.name)}</div><div className="cell-sub">{x.client_name} · {usdShort(x.committed)} of {usdShort(x.revised)}</div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
      <div className="stack">
        <div className="card">
          <div className="card-head"><div><h2>{shortName(p.name)}: {title}</h2>
            <p className="desc">{p.id} · {p.client_name} · {p.product} · {p.status}{p.budget_source === "erp" ? " · budget from the ERP (no tracker line)" : ""}</p></div></div>
          <Bullet p={p} max={Math.max(p.revised, p.committed) * 1.05} width={560} height={22} />
          <div className="legend"><span>Bar: committed spend {usd(p.committed)}</span><span>Marker: revised SOW {usd(p.revised)}</span>{p.pct_complete != null && <span>Tick: {pct(p.pct_complete)} complete</span>}</div>
          <section className="tiles">
            <Tile term="fee_actuals" label="Fee actuals" value={usdShort(p.fee_actuals)} foot={`${usdShort(p.unapproved_fee)} awaiting approval`} />
            <Tile term="oop_actuals" label="OOP actuals" value={usdShort(p.oop_actuals)} />
            <Tile term="open_po" label="Open POs" value={usdShort(p.open_po)} foot="Committed, not yet invoiced" />
            <Tile term="fee_burn" label="Fee burn" value={pct(p.fee_burn)} foot={p.pct_complete != null ? `vs ${pct(p.pct_complete)} complete` : "No % complete reported"} />
            {p.billing != null && <Tile term="billing" label="Billed to date" value={usdShort(p.billing)} />}
            <Tile term="jtd_revenue" label="JTD revenue" value={usdShort(p.jtd_revenue)} foot={p.mtd_revenue != null ? `${usdShort(p.mtd_revenue)} this month` : undefined} />
          </section>
          <dl className="facts">
            <div><dt>Contract</dt><dd>{p.contract}</dd></div>
            <div><dt>Dates</dt><dd>{p.start ?? "–"} → {p.end ?? "–"}</dd></div>
            <div><dt><Term id="role_ad">AD</Term></dt><dd>{p.ad ?? "–"}</dd></div>
            <div><dt>PM</dt><dd>{p.pm ?? "–"}</dd></div>
            <div><dt><Term id="role_cfa">CFA</Term></dt><dd>{p.cfa ?? "–"}</dd></div>
            <div><dt><Term id="role_cfm">CFM</Term></dt><dd>{p.cfm ?? "–"}</dd></div>
            <div><dt>Tracker</dt><dd>{p.tracker ?? "None: budget from the ERP"}</dd></div>
          </dl>
        </div>
        <div className="grid-2">
          <MonthlyColumns values={p.fee_by_month_2026} asOfMonth={asOfMonth} title={`Fee booked per month, 2026: ${usdShort(p.fee_by_month_2026.reduce((a, b) => a + b, 0))} so far`} />
          <div className="card">
            <div className="card-head"><h2>{ex.length ? `${ex.length} open CTA${ex.length > 1 ? "s" : ""} on this project` : "No open CTAs on this project"}</h2></div>
            {ex.map((e, i) => (
              <div key={i} className="check-row">
                <SeverityIcon severity={RULES[e.rule].severity} />
                <div style={{ flex: 1 }}><strong>{RULES[e.rule].label}</strong> · {e.detail}<div className="ink-2">{RULES[e.rule].next}</div>
                  <div className="req-row">{RULE_REQUESTS[e.rule].map((id) => <RequestButton key={id} typeId={id} text={exceptionText(id, e, p)} project={p} exception={e} />)}</div></div>
              </div>
            ))}
          </div>
        </div>
        <SourceFields key={p.id} projectId={p.id} viewerFile={viewerFile} role={role} catalog={catalog} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Data health (platform owner)
export function HealthView({ health, projects }: { health: Health | null; projects: Project[] }) {
  if (!health) return <div className="card empty">Data health is available to finance ops, CFMs and CFAs.</div>;
  const rejected = health.sources.filter((s) => s.status !== "accepted");
  const rec = health.reconciliation[0];
  const noCfa = projects.filter((p) => !p.cfa).length;
  return (
    <>
      <section className="tiles">
        <Tile term="sources_accepted" label="Sources accepted" value={`${health.sources.length - rejected.length} / ${health.sources.length}`} foot={rejected.length ? `${rejected.length} rejected; see below` : "No rejections"} />
        <Tile term="reconciliation" label="Reconciliation breaks" value={rec ? `${rec.actual} / ${rec.of}` : "–"} foot={rec ? `${rec.causes.unexplained ?? 0} need review` : ""} />
        <Tile term="tracker_parse" label="Tracker parse" value={pct(health.parse.revised_parsed, 1)} foot={`Revised SOW · % complete ${pct(health.parse.pct_parsed)}`} />
        <Tile term="no_cfa" label="Projects without a CFA" value={n0(noCfa)} foot="Exceptions fall back to the CFM" />
        <Tile term="role_gaps" label="Role map gaps" value={`${health.role_gaps.rolebook_ad_blank ?? "–"} / ${health.role_gaps.rolebook_rows ?? "–"}`} foot="Rows with no account director" />
      </section>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h2>Sources</h2></div>
          <div className="table-wrap" style={{ maxHeight: 460, overflowY: "auto" }}>
            <table className="data"><thead><tr><th>Report</th><th>File</th><th>Status</th><th className="num">Rows</th></tr></thead>
              <tbody>{health.sources.map((s, i) => (
                <tr key={i}><td>{s.report}</td><td className="cell-main" title={s.file}>{s.file ?? "all summary files"}</td>
                  <td>{s.status === "accepted" ? "accepted" : <span className="sev"><SeverityIcon severity="warning" size={12} />{s.status}</span>}</td>
                  <td className="num">{n0(s.rows)}</td></tr>
              ))}</tbody></table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Trackers parsed</h2><span className="muted">{health.trackers.length}</span></div>
          <div className="table-wrap" style={{ maxHeight: 460, overflowY: "auto" }}>
            <table className="data"><thead><tr><th>Tracker</th><th>Family</th><th className="num">Job rows</th></tr></thead>
              <tbody>{health.trackers.map((t) => <tr key={t.file}><td className="cell-main" title={t.file}>{t.file}</td><td>{t.family || "–"}</td><td className="num">{t.rows}</td></tr>)}</tbody></table>
          </div>
        </div>
      </div>
      {rec && <div className="notice">{rec.check}: {Object.entries(rec.causes).map(([k, v]) => `${v} ${k}`).join(" · ")}. {rec.note}</div>}
    </>
  );
}
