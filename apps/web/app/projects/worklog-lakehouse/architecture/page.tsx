"use client";

import { T, UI } from "../content";
import { Diagram, PageHead, Table, nowrap, rich, section, useT } from "../ui";

export default function Architecture() {
  const { t } = useT();
  const H = UI.heads.architecture;
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} lead={t(H.lead)} />

      <p className="small muted show-mobile">{t(UI.swipe)}</p>
      <Diagram />

      <section style={section}>
        <h2>{t(T.how.intro)}</h2>
        <div className="cards-3">
          {T.how.layers.map((l) => (
            <div className="panel card-n" key={l.n.en}>
              <span className="n">{t(l.n)}</span>
              <h3>{t(l.title)}</h3>
              <p className="small muted" style={{ fontSize: 13, lineHeight: "20px" }}>{rich(t(l.body))}</p>
              <ul className="mono small" style={{ paddingInlineStart: 16, gap: 2 }}>
                {l.tables.map((x) => <li key={x} style={{ fontSize: 12, lineHeight: "18px" }}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={section}>
        <h2>{t(T.runs.h)}</h2>
        <p>{rich(t(T.runs.intro))}</p>
        <Table head={<tr><th>{t(T.runs.cols[0])}</th><th>{t(T.runs.cols[1])}</th><th className="r">{t(T.runs.cols[2])}</th></tr>}>
          {T.runs.rows.map(([d, mode, s]) => (
            <tr key={d}><td className="mono small" style={nowrap}>{d}</td><td>{t(T.runs[mode])}</td><td className="r">{s}</td></tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
