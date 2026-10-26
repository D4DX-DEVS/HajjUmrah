import type { MetadataRoute } from "next";
import { SITE, allCategories, allPosts, authors, pageCount, postHref, postsIn } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, lastModified?: string) => ({ url: SITE + p, lastModified });
  return [
    u("/"), u("/videos"), u("/about"), u("/contact"), u("/privacy-policy"),
    ...allCategories.flatMap((c) => [
      u(`/${c.slug}`),
      ...Array.from({ length: pageCount(postsIn(c.slug).length) - 1 }, (_, i) => u(`/${c.slug}/page/${i + 2}`)),
    ]),
    ...authors.map((a) => u(`/author/${a.slug}`)),
    ...allPosts.map((p) => u(postHref(p), p.date)),
  ];
}
