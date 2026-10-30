import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// `next dev`: use the local copy of D1 and R2 (wrangler.jsonc bindings), never the live data
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  // WordPress served categories at /category/<cat>/; post, tag and author URLs are unchanged.
  async redirects() {
    return [
      { source: "/category/:cat", destination: "/:cat", permanent: true },
      { source: "/category/:cat/page/:n", destination: "/:cat/page/:n", permanent: true },
      // video-plugin utility pages on the old site; no content of their own
      { source: "/:p(video|player-embed|user-videos|search-videos|video-tag|video-category|4177-2)", destination: "/videos", permanent: true },
    ];
  },
};

export default nextConfig;
