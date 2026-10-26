import type { NextConfig } from "next";
import posts from "./content/posts.json";

const nextConfig: NextConfig = {
  /* config options here */
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
