import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hajj and Umrah",
    short_name: "Hajj & Umrah",
    description: "Malayalam articles, fatwas, fiqh, history and rituals of Hajj and Umrah from islamonlive.",
    lang: "ml",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#12100d",
    icons: [
      { src: "/uploads/2022/06/cropped-icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/uploads/2022/06/cropped-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
