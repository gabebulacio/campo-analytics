import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Static build only: the synthetic data in ./data is compiled into lazy JS chunks (src/data.ts), so the app
 * never fetches and can be served as plain files under gabrielbulacio.com/projects/project-finance/.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");

/**
 * Planted vs found per rule, for the Glossary's "How the checks are tested". Used only when the app's own data
 * doesn't carry it: read from the site's synthetic snapshot at build time, and only that one key is inlined.
 */
function plantedFallback(): unknown {
  const file = path.join(REPO, "projects/project-finance/snapshot.json");
  try { return JSON.parse(fs.readFileSync(file, "utf-8")).planted ?? null; } catch { return null; }
}

export default defineConfig({
  define: { __PLANTED__: JSON.stringify(plantedFallback()) },
  base: "/projects/project-finance/",
  plugins: [react()],
  json: { stringify: true },
  build: {
    outDir: path.resolve(HERE, "../web/public/projects/project-finance"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    host: "localhost", port: 5180, strictPort: true,
    // The case study's document reader imports these repo files (src/docs.ts); nothing else outside the app is served.
    fs: { allow: [HERE, ...["projects/project-finance/README.md", "projects/project-finance/build.py", "docs/consulting/drafts/project-finance-case.md"].map((f) => path.join(REPO, f))] },
  },
  preview: { host: "localhost" },
});
