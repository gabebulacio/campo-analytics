"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LAKEHOUSE_CODE, lakePath } from "@/lib/paths";
import { T, UI } from "./content";
import { PageHead, Table, section, useT } from "./ui";

export default function Overview() {
  const { t } = useT();
  const next = [
    { href: "/architecture", label: UI.nav.architecture },
    { href: "/identity", label: UI.nav.identity },
    { href: "/quality", label: UI.nav.quality },
    { href: "/outputs", label: UI.nav.outputs },
    { href: "/decisions", label: UI.nav.decisions },
  ];
  return (
    <div className="page doc prose">
      <PageHead eyebrow={t(UI.heads.overview.eyebrow)} h1={t(UI.heads.overview.h1)} lead={t(T.lede)} />

      <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {T.kpis.map((k) => (
          <div className="kpi" key={k.v}>
            <span className="v" dir="ltr">{k.v}</span>
            <span className="small muted">{t(k.l)}</span>
          </div>
        ))}
      </div>

      <section style={section}>
        <h2>{t(T.problem.h)}</h2>
        {T.problem.p.map((p) => <p key={p.en}>{t(p)}</p>)}
        <div className="site-links">
          {next.map((n) => (
            <Link key={n.href} href={lakePath(n.href)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {t(n.label)} <ArrowRight size={14} className="flip-rtl" />
            </Link>
          ))}
        </div>
      </section>

      <section style={section}>
        <h2>{t(T.real.h)}</h2>
        <Table>
          {T.real.rows.map(([what, status]) => (
            <tr key={what.en}><td>{t(what)}</td><td className="muted">{t(status)}</td></tr>
          ))}
        </Table>
      </section>

      <section style={section}>
        <h2>{t(T.run.h)}</h2>
        <pre className="code">{`git clone ${LAKEHOUSE_CODE}
cd worklog-lakehouse
python run.py setup    # Python path; add Java 17 + requirements-spark.txt for Spark
python run.py demo     # backfill + 7 daily runs
python run.py sql "select * from gold_mart_coverage_month"`}</pre>
        <p className="small muted">{t(T.run.stack)}</p>
        <p className="small">
          {t(T.run.more)} <a href={LAKEHOUSE_CODE}>{t(T.run.repo)}</a>
        </p>
      </section>
    </div>
  );
}
