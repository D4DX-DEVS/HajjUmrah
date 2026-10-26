import type { NextConfig } from "next";
import posts from "./content/posts.json";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
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
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Old WordPress URLs: /<slug>/ and /category/<cat>/ -> new structure.
  async redirects() {
    return [
      { source: "/category/:cat", destination: "/:cat", permanent: true },
      ...posts.map((p) => ({ source: `/${p.slug}`, destination: `/${p.category}/${p.slug}`, permanent: true })),
    ];
  },
};

export default nextConfig;
