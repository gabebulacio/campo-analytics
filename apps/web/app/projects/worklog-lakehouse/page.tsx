import Link from "next/link";
import { LAKEHOUSE_CODE } from "@/lib/paths";

// Figures come from `python run.py demo` (backfill + 7 daily runs) and `python run.py test`.
const KPIS = [
  { v: "11", l: "Fabric items: lakehouse, variable library, 7 notebooks, 2 pipelines" },
  { v: "28", l: "Delta tables across bronze, silver, gold, ops" },
  { v: "18", l: "quality checks on every run" },
  { v: "~10 s", l: "per daily run, on a laptop" },
];

const LAYERS = [
  ["Land", "nb_land_synthetic", "What each source API would return for this run. Copy jobs replace it in production."],
  ["Bronze", "nb_bronze_ingest", "One generic notebook: append-only, raw strings, lineage on every row, a manifest of extracts."],
  ["Silver", "nb_silver_users", "User history as SCD Type 2 in a single Delta MERGE, plus the identity map."],
  ["Silver", "nb_silver_worklogs", "Both sources in one schema, rebuilt with the person-day rule; source quirks fixed here."],
  ["Gold", "nb_gold", "Star schema with unknown members, append-only project keys, sold vs utilized, operational marts."],
  ["Quality", "nb_quality", "Reconciliation, foreign keys, SCD2 invariants, registry stability via Delta time travel."],
];

const REAL = [
  ["Fabric items in Git format, fabric-cicd deploy, parameter.yml per environment", "Real"],
  ["Notebooks, Delta tables, MERGE, quality gate, run log", "Real, and the same files run locally"],
  ["CI: lint, item checks, end-to-end runs on a temporary lakehouse", "Real"],
  ["Source systems (timesheets, issue tracker, directory, CRM)", "Synthetic, deterministic, with real-world quirks"],
  ["Deployed to a live Fabric capacity", "Not yet: runs locally and in CI"],
  ["Power BI Direct Lake model and report", "Next"],
];

export default function WorklogLakehouse() {
  return (
    <main className="site prose">
      <header>
        <p className="small muted">
          <Link href="/">Gabriel Bulacio</Link> · Project · 2026
        </p>
        <h1 style={{ marginTop: 4 }}>Worklog Lakehouse</h1>
        <p className="muted">
          A Microsoft Fabric medallion that turns two time-tracking systems, a user directory and a CRM into one governed star schema:
          who logged what, against which client, compared with what was sold. It deploys to Fabric, and the same notebook files run on a laptop.
        </p>
        <div className="site-links" style={{ marginTop: 12 }}>
          <a href={LAKEHOUSE_CODE}>Code and README</a>
          <a href={`${LAKEHOUSE_CODE}/tree/main/docs/decisions`}>Design decisions</a>
        </div>
      </header>

      <div className="kpis">
        {KPIS.map((k) => (
          <div className="kpi" key={k.l}>
            <span className="v">{k.v}</span>
            <span className="small muted">{k.l}</span>
          </div>
        ))}
      </div>

      <section>
        <h2>The problem</h2>
        <p>
          At work I owned the load that moved logged hours from two time-tracking systems into the database behind finance&apos;s reports. The hard
          part wasn&apos;t the APIs, it was the people. The same person showed up under different emails, legacy domains and swapped
          &quot;last.first&quot; logins. Deactivated accounts came back with blank emails, entries were edited or deleted weeks later, and
          project keys had to stay stable because finance referenced them.
        </p>
        <p>
          The rewrite I did there matched the existing load row for row before it replaced it. This project rebuilds that kind of pipeline
          from scratch, the way I&apos;d build it on Fabric, on a fictional company with synthetic data, so it can be public and anyone can run it.
        </p>
      </section>

      <section>
        <h2>How it works</h2>
        <pre className="code">{`sources ─▶ Files/landing ─▶ bronze_* ─▶ silver_* ─▶ gold_* ─▶ Power BI (Direct Lake)
                       append-only    canonical     star + marts
pl_daily / pl_monthly_full ─▶ nb_orchestrator: one run_id ─▶ … ─▶ quality gate`}</pre>
        <div className="table-wrap" style={{ maxHeight: "none" }}>
          <table className="simple">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Notebook</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {LAYERS.map(([layer, nb, what]) => (
                <tr key={nb}>
                  <td>{layer}</td>
                  <td className="mono small">{nb}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Three decisions worth defending</h2>
        <ul>
          <li>
            <strong>Python notebooks, not Spark.</strong> About 30k rows a quarter don&apos;t need a cluster. DuckDB and delta-rs start in
            seconds, cost a fraction of the capacity, and run identically on a laptop and in CI. The SQL ports to Spark if volume ever needs it.
          </li>
          <li>
            <strong>Recompute silver with the person-day rule.</strong> Each person-day takes the latest extract that contains it, and the monthly
            full extract removes days deleted at the source. Silver is a pure function of bronze, so any replay gives the same table. A test checks that
            daily incrementals and one full extract converge.
          </li>
          <li>
            <strong>Ranked matching rules, with ambiguous cases sent for review.</strong> Exact email first, then the source&apos;s own ID,
            then legacy domain and swapped name, and those last two only when the person&apos;s name is unique. Everything else stays in the
            fact as Unknown, so totals reconcile, and lands on a worklist for review.
          </li>
        </ul>
      </section>

      <section>
        <h2>The operator loop</h2>
        <p>
          After the demo, the quality gate raises one warning: 2.2% of hours can&apos;t be attributed. The worklist names two identities: a
          contractor whose tracker account was deleted, and a swapped login that could belong to either of two people with the same name. One
          line in the mapping file resolves the second; the next daily run attributes all 376 of its entries and the warning clears. That loop,
          not a cleverer fuzzy match, is what keeps a report like this trustworthy.
        </p>
      </section>

      <section>
        <h2>What&apos;s real and what&apos;s simulated</h2>
        <div className="table-wrap" style={{ maxHeight: "none" }}>
          <table className="simple">
            <tbody>
              {REAL.map(([what, status]) => (
                <tr key={what}>
                  <td>{what}</td>
                  <td className="muted">{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Run it</h2>
        <pre className="code">{`python run.py setup    # Python 3.11+, no Java or Spark
python run.py demo     # backfill + 7 daily runs
python run.py sql "select * from gold_mart_coverage_month"
python run.py test     # 35 tests + lint`}</pre>
        <p className="small muted">
          Python · DuckDB · Delta Lake (delta-rs) · Microsoft Fabric (Lakehouse, Notebooks, Data Pipelines, Variable Library) · fabric-cicd ·
          GitHub Actions. All people, clients and emails are synthetic.
        </p>
      </section>

      <footer className="small faint">
        <Link href="/">← All projects</Link>
      </footer>
    </main>
  );
}
