"use client";

import { ShieldCheck } from "lucide-react";
import { MODEL_FOLDERS, MODEL_MEASURES, MODEL_RELATIONSHIPS, MODEL_TABLES, UI } from "../content";
import { PageHead, Table, section, useT } from "../ui";

export default function SemanticModel() {
  const { t } = useT();
  const H = UI.heads.model;
  const M = UI.modelPage;
  const folders = Array.from(new Set(MODEL_MEASURES.map((m) => m.folder)));
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(H.eyebrow)} h1={t(H.h1)} lead={t(H.lead)} />

      <p className="small">
        <span className="badge" style={{ color: "var(--ok)", background: "var(--ok-soft)", marginInlineEnd: 8 }}>
          <ShieldCheck size={13} /> 190 / 190
        </span>
        {t(M.verified)}
      </p>

      <section style={section}>
        <h2>{t(M.tables)}</h2>
        <Table>
          {MODEL_TABLES.map((tb) => (
            <tr key={tb.name}>
              <td><strong>{tb.name}</strong></td>
              <td className="mono small">{tb.source}</td>
            </tr>
          ))}
        </Table>
        <h3 style={{ marginTop: 8 }}>{t(M.relationships)}</h3>
        <pre className="code">{MODEL_RELATIONSHIPS.join("\n")}</pre>
      </section>

      <section style={section}>
        <h2>{t(M.measures)}</h2>
        {folders.map((folder) => (
          <div key={folder} className="panel" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="eyebrow">{t(MODEL_FOLDERS[folder])}</span>
            {MODEL_MEASURES.filter((m) => m.folder === folder).map((m) => (
              <div key={m.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{ margin: 0 }}>
                  <strong>{m.name}</strong> <span className="small muted">· {m.table}</span>
                </p>
                <p className="small muted" style={{ margin: 0 }}>{t(m.desc)}</p>
                <pre className="code wrap">{m.dax}</pre>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section style={section}>
        <h2>{t(M.report)}</h2>
        <ul>{M.pages.map((pg) => <li key={pg.en}>{t(pg)}</li>)}</ul>
      </section>
    </div>
  );
}
