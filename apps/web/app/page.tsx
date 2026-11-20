import Image from "next/image";
import Link from "next/link";
import { ThemeButton } from "@/components/SiteControls";
import { FINANCE_BASE, HTR_BOOK, HTR_CODE, LAKEHOUSE_BASE, LAKEHOUSE_CODE } from "@/lib/paths";

// gabrielbulacio.com. Demos live under /projects/<name>.
const DEMO = "/projects/campo-analytics";

// A thumbnail of each project, captured from its live page in both themes (public/home/).
function Shot({ name, alt, width, height }: { name: string; alt: string; width: number; height: number }) {
  const sizes = "(max-width: 900px) 100vw, 620px";
  return (
    <div className="site-shot">
      <Image className="shot-light" src={`/home/${name}-light.webp`} alt={alt} width={width} height={height} sizes={sizes} />
      <Image className="shot-dark" src={`/home/${name}-dark.webp`} alt={alt} width={width} height={height} sizes={sizes} />
    </div>
  );
}

// From LinkedIn, newest first: what I owned, not job titles. Names only: no logos, which these firms restrict and which would read as a client list.
const EXPERIENCE: { company: string; roles: string; years: string }[] = [
  { company: "WPP Enterprise Solutions", roles: "Analytics engineering: semantic models, KPI definitions, Fabric", years: "2026 – present" },
  { company: "VML", roles: "Owned the data platform and executive reporting, working with C-level, Finance and Ops", years: "2025 – 2026" },
  { company: "PwC", roles: "Revenue operations and billing automation", years: "2023 – 2025" },
];

function Stats({ items }: { items: [string, string][] }) {
  return (
    <dl className="site-stats">
      {items.map(([n, label]) => (
        <div key={label}>
          <dt>{n}</dt>
          <dd>{label}</dd>
        </div>
      ))}
    </dl>
  );
}

// Same top bar, content padding and page width as the project pages, so moving between them doesn't shift anything.
export default function Home() {
  return (
    <>
      <header className="topbar site-topbar">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/" className="brand">Gabriel Bulacio</Link>
        </nav>
        <div className="spacer" />
        <ThemeButton />
      </header>
      <main className="content">
        <div className="page doc site">
          <header className="site-hero">
            <h1>Gabriel Bulacio</h1>
            <div className="site-intro">
            <p>
              I&apos;m an analytics engineer who builds data platforms, semantic layers and AI that answers questions on governed data. I like
              working with messy systems: helping organizations understand their current data foundation, then building a roadmap for what
              comes next, whether that&apos;s a programmatic or an agentic approach. For the last few years I&apos;ve worked across finance, growth
              and data (engineering, strategy and BI), turning disorganized data into insights teams can trust.
            </p>
            <p>
              My background is in physics, which shaped how I think about systems. I&apos;m completing a dual licenciatura (a
              six-year degree, master&apos;s equivalent) in Physics and Data Science, focused on complex and stochastic systems. I&apos;m based in
              Buenos Aires and work remotely in English, Spanish and Italian, with working Portuguese and Hebrew.
            </p>
            <p>
              On the side, I build handwritten text recognition for 17th and 18th century Spanish notarial and parish records (
              <a href={HTR_CODE}>code</a>). The first model I trained produced the preliminary transcription of an 1806 parish census, published
              as <a href={HTR_BOOK}>a book</a> in 2025.
            </p>
            </div>
            <aside className="site-facts" aria-label="At a glance">
              <dl>
                <div><dt className="eyebrow">Based in</dt><dd>Buenos Aires, working remotely</dd></div>
                <div><dt className="eyebrow">Languages</dt><dd>English, Spanish, Italian; working Portuguese and Hebrew</dd></div>
                <div><dt className="eyebrow">Education</dt><dd>Licenciatura in Physics and Data Science, in progress</dd></div>
              </dl>
              <div className="site-ctas">
                <a className="site-btn site-btn-primary" href="https://calendly.com/gabrielbulacio/intro-meeting">
                  Book an intro call
                </a>
                <a className="site-btn" href="https://www.linkedin.com/in/gabulacio/">LinkedIn</a>
                <a className="site-btn" href="https://github.com/gabebulacio">GitHub</a>
              </div>
            </aside>
          </header>

          <section className="site-experience" aria-labelledby="experience-h">
            <h2 id="experience-h" className="eyebrow">Experience</h2>
            <ol>
              {EXPERIENCE.map((e) => (
                <li key={e.company}>
                  <span className="small faint num">{e.years}</span>
                  <span className="site-company">{e.company}</span>
                  <span className="small muted">{e.roles}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="site-projects">
            <h2 className="site-h">Projects</h2>
            <div className="site-project-list">
            <article className="site-project">
              <div className="site-project-body">
                <div className="site-project-head">
                  <h3>Project Finance Checks</h3>
                  <span className="faint small">2026</span>
                </div>
                <p>
                  A shared finance team ran client projects out of the ERP and a spreadsheet per client. I built the platform that reads both,
                  checks every live project and gives each role its own view. Rebuilt on synthetic data so you can use it: pick a role and see what
                  that person sees.
                </p>
                <Stats
                  items={[
                    ["11", "checks on every live project"],
                    ["110 of 110", "planted errors found, on the right projects (a regression test, not accuracy on real data)"],
                    ["5", "roles: analysts and managers see their projects, directors their clients, ops everything"],
                  ]}
                />
                <p className="small muted">Demo: Python · Next.js · Recharts. Original: a Power BI report generated from Python (employer, not public)</p>
                <div className="site-links">
                  {/* A separate static app (apps/project-finance), so plain links rather than client-side navigation */}
                  <a href={FINANCE_BASE}>Open the dashboard</a>
                  <a href={`${FINANCE_BASE}?viewer=all&view=case`}>Case study</a>
                </div>
              </div>
              <Shot name="finance-account" alt="The dashboard's Account position page: budget tiles and a scatter of fee burn against % complete, with projects ahead of delivery highlighted" width={1536} height={1100} />
            </article>
            <article className="site-project">
              <div className="site-project-body">
                <div className="site-project-head">
                  <h3>Worklog Lakehouse</h3>
                  <span className="faint small">2026</span>
                </div>
                <p>
                  A Microsoft Fabric medallion in PySpark and Python that turns two time-tracking systems, a user directory and a CRM into one
                  governed star schema, served by a Direct Lake semantic model. Adapted, on synthetic data, from a production platform I built on
                  Fabric.
                </p>
                <Stats
                  items={[
                    ["0", "rows differ, PySpark vs Python"],
                    ["26", "DAX measures, checked against the lakehouse"],
                    ["18", "quality checks on every run"],
                  ]}
                />
                <p className="small muted">PySpark · Delta Lake · Microsoft Fabric · Power BI (Direct Lake, DAX) · fabric-cicd · GitHub Actions</p>
                <div className="site-links">
                  <Link href={LAKEHOUSE_BASE}>Case study</Link>
                  <a href={LAKEHOUSE_CODE}>Code</a>
                </div>
              </div>
              <Shot name="worklog-gold" alt="The case study's Outputs page: what the gold layer answers, starting with a table of who is logging their time each month" width={1536} height={1344} />
            </article>
            <article className="site-project">
              <div className="site-project-body">
                <div className="site-project-head">
                  <h3>Campo Analytics</h3>
                  <span className="faint small">2026</span>
                </div>
                <p>
                  Ask a business question about agricultural supply-chain data and get a chart where every number traces back to its metric
                  definition, its SQL and its source rows. The LLM only picks metrics from a semantic layer; a deterministic compiler writes the SQL.
                  Synthetic data.
                </p>
                <Stats
                  items={[
                    ["98%", "correct results, 77 questions × 3 runs"],
                    ["98.7%", "same answer across repeated runs"],
                    ["3 s", "median answer, $0.002 each"],
                  ]}
                />
                <p className="small muted">Python · FastAPI · SQL · DuckDB/Postgres · Next.js · Claude API</p>
                <div className="site-links">
                  <a href={DEMO}>Open the demo</a>
                  <a href={`${DEMO}/case`}>Case study</a>
                  <a href="https://github.com/gabebulacio/campo-analytics">Code</a>
                </div>
              </div>
              <Shot name="campo-ask" alt="The demo's Ask page: a question box and five starter questions, from a verified query to an injection attempt that gets blocked" width={1536} height={994} />
            </article>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
