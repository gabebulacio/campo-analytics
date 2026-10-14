"use client";

import { T, UI } from "../content";
import { PageHead, rich, useT } from "../ui";

export default function Decisions() {
  const { t } = useT();
  const H = UI.heads.decisions;
  const D = T.decisions;
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} lead={t(D.intro)} />

      {D.items.map((d) => (
        <article className="panel" key={d.n} id={`adr-${d.n}`} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <p className="small muted" style={{ fontSize: 12 }}>
            <span className="mono">ADR {d.n}</span> · {t(D.labels.status)}
          </p>
          <h2 style={{ marginTop: 0 }}>{t(d.title)}</h2>
          <p><strong>{t(D.labels.context)}.</strong> {rich(t(d.context))}</p>
          <p><strong>{t(D.labels.decision)}.</strong> {rich(t(d.decision))}</p>
          <p><strong>{t(D.labels.consequences)}.</strong></p>
          <ul>{d.consequences.map((c) => <li key={c.en}>{rich(t(c))}</li>)}</ul>
        </article>
      ))}
    </div>
  );
}
