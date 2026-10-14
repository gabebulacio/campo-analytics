"use client";

import { T, UI } from "../content";
import { PageHead, Table, section, useT } from "../ui";

export default function Identity() {
  const { t } = useT();
  const H = UI.heads.identity;
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} lead={t(T.rules.intro)} />

      <section style={section}>
        <h2>{t(T.rules.h)}</h2>
        <Table head={<tr><th>{t(T.rules.cols[0])}</th><th>{t(T.rules.cols[1])}</th><th className="r">{t(T.rules.cols[2])}</th></tr>}>
          {T.rules.rows.map(([n, rule, share]) => (
            <tr key={rule.en}><td>{n}</td><td>{t(rule)}</td><td className="r">{share}</td></tr>
          ))}
        </Table>
      </section>

      <section style={section}>
        <h2>{t(T.review.h)}</h2>
        <p>{t(T.review.intro)}</p>
        <div className="cards-3">
          {T.review.cards.map((w) => (
            <div className="panel card-n" key={w.login}>
              <span className="n">{t(w.source)}</span>
              <span className="mono small">{w.login}</span>
              <span className="small muted">{w.entries} {t(T.review.entries)} · {w.hours} {t(T.review.hours)}</span>
              <span className="small">{t(w.why)}</span>
            </div>
          ))}
        </div>
        <p>{t(T.review.fixIntro)}</p>
        <pre className="code wrap">{T.review.fixLine}</pre>
        <p>{t(T.review.after)}</p>
      </section>
    </div>
  );
}
