/**
 * Shape of the case study (content in caseStudy.ts, page in components/CaseStudy.tsx). Every claim carries a
 * source: a repo document ("docs/consulting/drafts/project-finance-case.md") that the in-app reader can open, or a URL.
 */
export interface SourceRef { label: string; doc?: string; url?: string }

export type Block =
  | { kind: "text"; body: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "stats"; stats: { value: string; label: string; source?: SourceRef }[] }
  | { kind: "table"; caption?: string; columns: string[]; rows: string[][]; source?: SourceRef }
  | { kind: "decision"; decision: string; why: string; evidence: SourceRef[]; alternatives?: string[]; tradeoff?: string }
  | { kind: "timeline"; steps: { when: string; title: string; text: string; done?: boolean }[] }
  | { kind: "callout"; tone: "insight" | "risk" | "open"; title: string; body: string; source?: SourceRef }
  | { kind: "sources"; items: SourceRef[] };

export interface CaseSection { id: string; eyebrow: string; title: string; summary: string; blocks: Block[] }

export interface CaseStudy {
  title: string;
  subtitle: string;
  asOf: string;
  /** 3–5 headline results shown above the fold. */
  headline: { value: string; label: string; source?: SourceRef }[];
  sections: CaseSection[];
}
