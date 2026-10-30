import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain HTML in ./out, served by Cloudflare static assets (free, no Worker CPU).
  // Redirects and headers live in public/_redirects and public/_headers; the APIs are worker/index.ts.
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
