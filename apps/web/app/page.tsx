import Link from "next/link";
import { LAKEHOUSE_BASE, LAKEHOUSE_CODE } from "@/lib/paths";

// gabrielbulacio.com. Demos live under /projects/<name>.
const DEMO = "/projects/campo-analytics";

export default function Home() {
  return (
    <main className="site">
      <header>
        <h1>Gabriel Bulacio</h1>
        <p className="muted">Analytics engineer. I build semantic layers, data platforms, and AI that answers questions on top of governed data.</p>
      </header>

      <section>
        <h2 className="site-h">Projects</h2>
        <article className="site-project">
          <div className="site-project-head">
            <h3>Worklog Lakehouse</h3>
            <span className="faint small">2026</span>
          </div>
          <p>
            A Microsoft Fabric medallion that turns two time-tracking systems, a user directory and a CRM into one governed star schema for
            Power BI. It deploys to Fabric with fabric-cicd, and the same notebooks run on a laptop. Identity resolution through ranked matching
            rules, with ambiguous cases sent for review; project keys that never change; and a quality gate on every run. Synthetic data.
          </p>
          <p className="small muted">Python · DuckDB · Delta Lake · Microsoft Fabric · fabric-cicd · GitHub Actions</p>
          <div className="site-links">
            <Link href={LAKEHOUSE_BASE}>Case study</Link>
            <a href={LAKEHOUSE_CODE}>Code</a>
          </div>
        </article>
        <article className="site-project">
          <div className="site-project-head">
            <h3>Campo Analytics</h3>
            <span className="faint small">2026</span>
          </div>
          <p>
            Ask a business question about agricultural supply-chain data and get a chart where every number traces back to its metric
            definition, its SQL and its source rows. The LLM only picks metrics from a semantic layer; a deterministic compiler writes the SQL.
            Synthetic data.
          </p>
          <p className="small muted">Python · FastAPI · SQL · DuckDB/Postgres · Next.js · Claude API</p>
          <div className="site-links">
            <a href={DEMO}>Open the demo</a>
            <a href={`${DEMO}/case`}>Case study</a>
            <a href="https://github.com/gabebulacio/campo-analytics">Code</a>
          </div>
        </article>
      </section>

      <footer className="small faint">
        <Link href="https://github.com/gabebulacio">GitHub</Link>
      </footer>
    </main>
  );
}
