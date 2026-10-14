"use client";

import { T, UI } from "../content";
import { PageHead, Table, section, useT } from "../ui";

export default function Quality() {
  const { t } = useT();
  const H = UI.heads.quality;
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} lead={t(T.gate.intro)} />

      <section style={section}>
        <Table head={<tr>{T.gate.cols.map((c) => <th key={c.en}>{t(c)}</th>)}</tr>}>
          {T.gate.rows.map(([check, sev, res]) => {
            const tone = res === "pass" ? "ok" : "warn";
            return (
              <tr key={check.en}>
                <td>{t(check)}</td>
                <td className="muted">{t(T.gate[sev])}</td>
                <td>
                  <span className="badge" style={{ color: `var(--${tone})`, background: `var(--${tone}-soft)` }}>
                    {t(res === "pass" ? T.gate.pass : T.gate.warning)}
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
        <p className="small muted">{t(T.gate.story)}</p>
      </section>
    </div>
  );
}
