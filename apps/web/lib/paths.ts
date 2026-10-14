// The demo lives under a path on the personal site: gabrielbulacio.com/projects/campo-analytics.
// Every internal demo link goes through demoPath so the prefix is defined once.
export const DEMO_BASE = "/projects/campo-analytics";

export const demoPath = (p = "/") => (p === "/" ? DEMO_BASE : DEMO_BASE + p);

// Worklog Lakehouse: a case-study page here; the code is its own repo.
export const LAKEHOUSE_BASE = "/projects/worklog-lakehouse";
export const LAKEHOUSE_CODE = "https://github.com/gabebulacio/worklog-lakehouse";
