/**
 * The documents the case study cites, readable in the app. Only files from this repository that hold no real
 * data: the synthetic build's README and generator, and the case study draft. Bundled as raw text, loaded on demand.
 */
const text = import.meta.glob<string>(
  [
    "../../../projects/project-finance/README.md",
    "../../../projects/project-finance/build.py",
    "../../../docs/consulting/drafts/project-finance-case.md",
  ],
  { query: "?raw", import: "default" },
);

/** Glob key -> repo-relative path ("../../../docs/x.md" -> "docs/x.md"). */
const toRepo = (k: string) => k.replace(/^(\.\.\/)+/, "");
const loaders = new Map<string, () => Promise<string>>(Object.entries(text).map(([k, l]) => [toRepo(k), l] as const));

export type DocKind = "markdown" | "code" | "image";
export interface DocInfo { path: string; group: string; title: string; kind: DocKind }

export const kindOf = (path: string): DocKind => (/\.md$/i.test(path) ? "markdown" : /\.(png|jpe?g|svg)$/i.test(path) ? "image" : "code");

const GROUPS: [RegExp, string][] = [
  [/^docs\//, "Case study"], [/\.md$/, "Guides"], [/./, "Code that computes the figures"],
];

export const DOCS: DocInfo[] = [...loaders.keys()].sort().map((path) => ({
  path,
  kind: kindOf(path),
  group: GROUPS.find(([re]) => re.test(path))![1],
  title: kindOf(path) === "markdown"
    ? path.split("/").pop()!.replace(/\.md$/, "").replace(/^(\d+|R\d+|T\d+)-/, "$1 ").replace(/[-_]/g, " ")
    : path.split("/").pop()!,
}));

export const hasDoc = (path: string) => loaders.has(normalize(path));
export const loadDoc = async (path: string) => {
  const load = loaders.get(normalize(path));
  if (!load) throw new Error(`Not in the app: ${path}`);
  return load();
};

/** Accepts "docs/x.md", "./docs/x.md", "docs\\x.md" and "docs/x.md#section". */
export function normalize(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "").split("#")[0];
}

/** Resolve a relative link inside one doc ("../README.md") against that doc's folder. */
export function resolveLink(from: string, href: string) {
  const parts = from.split("/").slice(0, -1);
  for (const seg of href.split("#")[0].split("/")) {
    if (seg === "..") parts.pop();
    else if (seg && seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}
