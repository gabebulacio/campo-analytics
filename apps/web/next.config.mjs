/** @type {import('next').NextConfig} */
const PIPELINE_URL = process.env.PIPELINE_URL || "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/pipeline/:path*", destination: `${PIPELINE_URL}/:path*` }];
  },
};

export default nextConfig;
