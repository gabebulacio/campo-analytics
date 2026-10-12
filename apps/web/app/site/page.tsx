import Link from "next/link";

// gabrielbulacio.com (the middleware rewrites "/" here). The demo lives on demo.gabrielbulacio.com.
const DEMO = "https://demo.gabrielbulacio.com";

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
