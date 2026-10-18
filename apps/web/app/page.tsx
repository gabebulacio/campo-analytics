import Link from "next/link";
import { HTR_BOOK, LAKEHOUSE_BASE, LAKEHOUSE_CODE } from "@/lib/paths";

// gabrielbulacio.com. Demos live under /projects/<name>.
const DEMO = "/projects/campo-analytics";

export default function Home() {
  return (
    <main className="site">
      <header>
        <h1>Gabriel Bulacio</h1>
        <p>
          I&apos;m an analytics engineer who builds data platforms, semantic layers and AI that answers questions on governed data. I like
          working with messy systems: helping organizations understand their current data foundation, then building a roadmap for what
          comes next, whether that&apos;s a programmatic or an agentic approach. For the last few years I&apos;ve worked across finance, growth
          and data (engineering, strategy and BI), turning disorganized data into insights teams can trust.
        </p>
        <p>
          My background is in physics, which shaped how I think about systems. I&apos;m completing a dual licenciatura (a
          six-year degree, master&apos;s equivalent) in Physics and Data Science, focused on complex and stochastic systems. I&apos;m based in
          Buenos Aires and work remotely in English and Spanish, with working Portuguese and Hebrew.
        </p>
        <div className="site-links">
          <a href="https://calendly.com/gabrielbulacio/intro-meeting">Book an intro call</a>
          <a href="https://www.linkedin.com/in/gabulacio/">LinkedIn</a>
        </div>
      </header>

      <section>
        <h2 className="site-h">Projects</h2>
        <article className="site-project">
          <div className="site-project-head">
            <h3>Worklog Lakehouse</h3>
            <span className="faint small">2026</span>
          </div>
          <p>
            A Microsoft Fabric medallion in PySpark and Python that turns two time-tracking systems, a user directory and a CRM into one
            governed star schema, served by a Direct Lake semantic model with 26 DAX measures, each checked against the lakehouse. Both
            engines run the same logic and a parity gate proves they produce identical tables; it all deploys to Fabric with fabric-cicd. Identity resolution through ranked matching rules, with ambiguous cases sent for review;
            project keys that never change; and a quality gate on every run. Adapted, on synthetic data, from a platform I run in production on Fabric.
          </p>
          <p className="small muted">PySpark · Spark SQL · Delta Lake · Microsoft Fabric · Power BI (Direct Lake, DAX) · fabric-cicd · Python · DuckDB · GitHub Actions</p>
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
        <article className="site-project">
          <div className="site-project-head">
            <h3>Notarial HTR</h3>
            <span className="faint small">2025–present</span>
          </div>
          <p>
            Handwritten text recognition for 17th and 18th century Spanish notarial and parish records, starting with marriage files from
            Ancasti, Catamarca. The first model I trained, a CNN + LSTM + CTC network after Harald Scheidl&apos;s work, produced the
            preliminary transcription of a 55-folio parish census from 1806, published as a book in 2025. Now rebuilding the pipeline on
            Kraken with a historical base model, a correction editor and a fixed evaluation set.
          </p>
          <p className="small muted">Python · PyTorch · Kraken · TensorFlow · OpenCV · PAGE XML · Kaggle GPUs</p>
          <div className="site-links">
            <a href={HTR_BOOK}>The book</a>
          </div>
        </article>
      </section>

      <footer className="small faint">
        <Link href="https://github.com/gabebulacio">GitHub</Link>
      </footer>
    </main>
  );
}
