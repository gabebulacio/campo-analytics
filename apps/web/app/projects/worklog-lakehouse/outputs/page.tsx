"use client";

import { T, UI } from "../content";
import { PageHead, Table, nowrap, rich, section, useT } from "../ui";

export default function Outputs() {
  const { t } = useT();
  const H = UI.heads.outputs;
  const C = T.gold.coverage, S = T.gold.sold, Hi = T.gold.history;
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} />

      <section style={section}>
        <h2>{t(C.h)}</h2>
        <p className="small muted">{t(C.intro)}</p>
        <Table head={<tr>{C.cols.map((c, i) => <th key={c.en} className={i ? "r" : ""}>{t(c)}</th>)}</tr>}>
          {C.rows.map(([e, l, c], i) => (
            <tr key={i}><td>{t(C.months[i])}</td><td className="r">{e}</td><td className="r">{l}</td><td className="r">{c}</td></tr>
          ))}
        </Table>
        <p className="small muted">{rich(t(C.after))}</p>
      </section>

      <section style={section}>
        <h2>{t(S.h)}</h2>
        <p className="small muted">{t(S.intro)}</p>
        <Table head={<tr>{S.cols.map((c, i) => <th key={c.en} className={i ? "r" : ""}>{t(c)}</th>)}</tr>}>
          {S.rows.map(([s, n, a, l]) => (
            <tr key={s.en}><td>{t(s)}</td><td className="r">{n}</td><td className="r">{a}</td><td className="r">{l}</td></tr>
          ))}
        </Table>
      </section>

      <section style={section}>
        <h2>{t(Hi.h)}</h2>
        <p className="small muted">{t(Hi.intro)}</p>
        <Table head={<tr>{Hi.cols.map((c) => <th key={c.en}>{t(c)}</th>)}</tr>}>
          {Hi.rows.map(([who, dept, from, to]) => (
            <tr key={who + from}>
              <td style={nowrap}>{who}</td>
              <td>{t(dept)}</td>
              <td className="mono small" style={nowrap}>{from}</td>
              <td className={to ? "mono small" : "muted"} style={nowrap}>{to || t(Hi.current)}</td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
