// The demo lives under a path on the personal site: gabrielbulacio.com/projects/campo-analytics.
// Every internal demo link goes through demoPath so the prefix is defined once.
export const DEMO_BASE = "/projects/campo-analytics";

export const demoPath = (p = "/") => (p === "/" ? DEMO_BASE : DEMO_BASE + p);
