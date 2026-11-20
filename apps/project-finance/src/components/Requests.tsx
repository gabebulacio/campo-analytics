import { useState } from "react";
import type { ExceptionRow } from "../types";
import { RULES, n0 } from "../format";
import { REQUEST_TYPES, RULE_REQUESTS } from "../requests";
import { SeverityIcon } from "./common";
import { RequestButton } from "./Info";

/**
 * Where people raise requests (the request desk). Shows which request type fixes each CTA and how many open CTAs
 * in this scope point at it, so the team can see demand next to the data.
 */
export function RequestsView({ exceptions }: { exceptions: ExceptionRow[] }) {
  const [theme, setTheme] = useState("all");
  const open = new Map<string, number>();
  exceptions.filter((e) => !RULES[e.rule].hidden).forEach((e) => {
    const id = RULE_REQUESTS[e.rule][0];
    open.set(id, (open.get(id) ?? 0) + 1);
  });
  const themes = [...new Set(REQUEST_TYPES.map((r) => r.theme))];
  const rows = REQUEST_TYPES.filter((r) => theme === "all" || r.theme === theme)
    .sort((a, b) => (open.get(b.id) ?? 0) - (open.get(a.id) ?? 0) || b.volume180 - a.volume180);
  const mapped = new Set(Object.values(RULE_REQUESTS).flat());
  const total = REQUEST_TYPES.reduce((a, r) => a + r.volume180, 0);
  const reporting = REQUEST_TYPES.find((r) => r.id === "reporting")?.volume180 ?? 0;
  return (
    <>
      <section className="tiles">
        <div className="tile"><div className="label">Request types</div><div className="value">{n0(REQUEST_TYPES.length)}</div><div className="foot">{n0(mapped.size)} of them fix at least one check</div></div>
        <div className="tile"><div className="label">Open CTAs in your scope with a matching request</div><div className="value">{n0([...open.values()].reduce((a, b) => a + b, 0))}</div><div className="foot">Each one opens the right form, filled in</div></div>
        <div className="tile"><div className="label">Desk requests, last 180 days</div><div className="value">{n0(total)}</div><div className="foot">About {n0(Math.round(total / 6))} a month (synthetic)</div></div>
        <div className="tile"><div className="label">Reporting requests</div><div className="value">{n0(reporting)}</div><div className="foot">Demand this platform answers self-serve (synthetic)</div></div>
      </section>
      <div className="card">
        <div className="card-head">
          <div><h2>Raise a request on the request desk</h2>
            <p className="desc">The button opens a mock of the desk's form for that request type. From a CTA (My work queue or a project brief), the form comes filled in with the project, the check and the amount.</p></div>
          <label className="inline-filter">Theme<select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="all">All themes</option>{themes.map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Request type</th><th>What it's for</th><th>Fixes these CTAs</th><th className="num">Open CTAs here</th><th className="num">Last 180 days</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const rules = (Object.keys(RULE_REQUESTS) as (keyof typeof RULE_REQUESTS)[]).filter((k) => RULE_REQUESTS[k].includes(r.id));
                return (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong><div className="cell-sub">{r.theme}</div></td>
                    <td style={{ maxWidth: 360 }}>{r.what}</td>
                    <td>{rules.length ? rules.map((k) => <div key={k} className="sev line"><SeverityIcon severity={RULES[k].severity} size={12} />{RULES[k].label}</div>) : <span className="muted">–</span>}</td>
                    <td className="num">{open.get(r.id) ? n0(open.get(r.id)!) : "–"}</td>
                    <td className="num">{n0(r.volume180)}</td>
                    <td><RequestButton compact typeId={r.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">The request types and their forms are generic versions of the real desk's. The 180-day volumes are synthetic. The CTA-to-request mapping is the one the real platform proposed to its shared-services team, for that team to confirm.</p>
      </div>
    </>
  );
}
