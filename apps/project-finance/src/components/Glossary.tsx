import { useState } from "react";
import { GLOSSARY, type Term } from "../glossary";
import { RULES, RULE_ORDER, n0 } from "../format";
import type { Planted } from "../planted";
import { SeverityIcon } from "./common";

/** Every term behind the (i) tooltips, every check and its rule, and how the checks were tested, in one page. */
export function GlossaryView({ planted }: { planted?: Planted }) {
  const [q, setQ] = useState("");
  const terms = (Object.values(GLOSSARY) as Term[]).filter((t) => !q || `${t.label} ${t.what} ${t.how ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(terms.map((t) => t.group))];
  const rules = RULE_ORDER.filter((r) => !q || `${RULES[r].label} ${RULES[r].why} ${RULES[r].next}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="card">
        <input className="search" placeholder="Search terms, for example burn, SOW or OOP" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the glossary" style={{ maxWidth: 420 }} />
      </div>
      {planted && <TestedChecks planted={planted} />}
      <div className="glossary">
        {groups.map((g) => (
          <section key={g} className="card">
            <h2>{g}</h2>
            <dl className="defs">
              {terms.filter((t) => t.group === g).map((t) => (
                <div key={t.label}>
                  <dt>{t.label}</dt>
                  <dd>{t.what}{t.how && <span className="how"><b>How it's worked out:</b> {t.how}</span>}{t.source && <span className="src">Source: {t.source}</span>}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {rules.length > 0 && (
          <section className="card">
            <h2>Call to actions</h2>
            <dl className="defs">
              {rules.map((r) => (
                <div key={r}>
                  <dt className="sev"><SeverityIcon severity={RULES[r].severity} size={13} />{RULES[r].label}</dt>
                  <dd>{RULES[r].why}.<span className="how"><b>Next step:</b> {RULES[r].next}</span><span className="src">Rule {RULES[r].id} · severity {RULES[r].severity}{RULES[r].hidden ? " · hidden by default" : ""}</span></dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </>
  );
}

/** The generator plants a known number of errors per rule; the checks run without knowing where they are. */
function TestedChecks({ planted }: { planted: Planted }) {
  const rows = RULE_ORDER.filter((r) => planted[r]).map((r) => ({ r, ...planted[r]! }));
  const all = rows.reduce((a, x) => ({ p: a.p + x.planted, f: a.f + x.found }), { p: 0, f: 0 });
  const exact = rows.filter((x) => x.planted === x.found).length;
  return (
    <section className="card" aria-labelledby="tested-h">
      <div className="card-head"><div>
        <h2 id="tested-h">How the checks are tested: {exact} of {rows.length} rules find exactly what was planted</h2>
        <p className="desc">The synthetic generator plants a known number of errors for each rule, each on its own project, and records them apart from the data. Then the checks run on the computed projects without knowing where the errors are. Found counts only the planted projects the rule caught.</p>
      </div></div>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Rule</th><th>Severity</th><th className="num">Planted</th><th className="num">Found</th><th>Result</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.r}>
                <td><span className="sev"><SeverityIcon severity={RULES[x.r].severity} size={13} />{RULES[x.r].label}</span><div className="cell-sub">{RULES[x.r].why}</div></td>
                <td>{RULES[x.r].severity}{RULES[x.r].hidden ? " (hidden)" : ""}</td>
                <td className="num">{n0(x.planted)}</td>
                <td className="num">{n0(x.found)}</td>
                <td>{x.found === x.planted ? <span className="ok-text">All found</span> : <span className="neg">{n0(Math.abs(x.planted - x.found))} {x.found < x.planted ? "missed" : "extra"}</span>}</td>
              </tr>
            ))}
            <tr className="total"><td><strong>All rules</strong></td><td /><td className="num"><strong>{n0(all.p)}</strong></td><td className="num"><strong>{n0(all.f)}</strong></td><td /></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
