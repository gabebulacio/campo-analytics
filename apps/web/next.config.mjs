/** @type {import('next').NextConfig} */
const PIPELINE_URL = process.env.PIPELINE_URL || "http://127.0.0.1:8001";

// Site layout: gabrielbulacio.com is the personal page (app/page.tsx); demos live under /projects/<name>.
const CAMPO = "/projects/campo-analytics";
// Pages the demo used to serve at the root of demo.gabrielbulacio.com (and, before that, the apex).
const OLD_DEMO_PAGES = ["dashboards", "metrics", "evals", "traces", "trace/:id", "case", "architecture", "plan"];

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/pipeline/:path*", destination: `${PIPELINE_URL}/:path*` }];
  },
  async redirects() {
    return [
      // Old subdomain: every link, including shared ?q= questions, lands on the same page under the new path.
      {
        source: "/:path*",
        has: [{ type: "host", value: "demo.gabrielbulacio.com" }],
        destination: `https://gabrielbulacio.com${CAMPO}/:path*`,
        permanent: true,
      },
      // Old demo links on the root domain.
      { source: "/", has: [{ type: "query", key: "q" }], destination: CAMPO, permanent: true },
      ...OLD_DEMO_PAGES.map((p) => ({ source: `/${p}`, destination: `${CAMPO}/${p}`, permanent: true })),
    ];
  },
};

export default nextConfig;
