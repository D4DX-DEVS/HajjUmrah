import type { NextConfig } from "next";

// next/image may only load remote images from the R2 host when NEXT_PUBLIC_MEDIA_URL is set
const media = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;

const nextConfig: NextConfig = {
  images: media
    ? { remotePatterns: [{ protocol: media.protocol === "http:" ? "http" : "https", hostname: media.hostname, pathname: "/uploads/**" }] }
    : undefined,
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
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
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
