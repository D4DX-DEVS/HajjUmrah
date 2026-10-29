import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are prerendered at build time; only /api/* runs as Vercel Functions.
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
      // Uploaded images never change under the same name: cache them for a year.
      { source: "/uploads/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // Pages are static. The CDN keeps them until the next deploy (a deploy purges it); browsers reuse them for a minute.
      { source: "/((?!api|_next|uploads).*)", headers: [{ key: "Cache-Control", value: "public, max-age=60, s-maxage=31536000, stale-while-revalidate=86400" }] },
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
