// The demo lives under a path on the personal site: gabrielbulacio.com/projects/campo-analytics.
// Every internal demo link goes through demoPath so the prefix is defined once.
export const DEMO_BASE = "/projects/campo-analytics";

export const demoPath = (p = "/") => (p === "/" ? DEMO_BASE : DEMO_BASE + p);

// Worklog Lakehouse: a case-study page here; the code is its own repo.
export const LAKEHOUSE_BASE = "/projects/worklog-lakehouse";
export const lakePath = (p = "/") => (p === "/" ? LAKEHOUSE_BASE : LAKEHOUSE_BASE + p);
export const LAKEHOUSE_CODE = "https://github.com/gabebulacio/worklog-lakehouse";

// Notarial HTR: only a card on the personal page, linking to the code and the book.
export const HTR_CODE = "https://github.com/gabebulacio/notarial-htr";
export const HTR_BOOK = "https://www.amazon.com.br/Catamarca-Curato-Ancasti-Matricula-1806/dp/6310120964";

// Project Finance Checks: an interactive dashboard on synthetic data, served from this app. No public code repo.
export const FINANCE_BASE = "/projects/project-finance";
export const financePath = (p = "/") => (p === "/" ? FINANCE_BASE : FINANCE_BASE + p);
