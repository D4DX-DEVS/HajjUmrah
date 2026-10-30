import type { MetadataRoute } from "next";
import { SITE, getData, pageCount, postHref } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { allCategories, allPosts, allTags, allVideos, authors, postsIn, postsTagged } = await getData();
  const u = (p: string, lastModified?: string) => ({ url: SITE + encodeURI(p), lastModified });
  return [
    u("/"), u("/videos"), u("/about"), u("/contact"), u("/privacy-policy"),
    ...allCategories.flatMap((c) => [
      u(`/${c.slug}`),
      ...Array.from({ length: pageCount(postsIn(c.slug).length) - 1 }, (_, i) => u(`/${c.slug}/page/${i + 2}`)),
    ]),
    ...allTags.flatMap((t) => [
      u(`/tag/${t.slug}`),
      ...Array.from({ length: pageCount(postsTagged(t.slug).length) - 1 }, (_, i) => u(`/tag/${t.slug}/page/${i + 2}`)),
    ]),
    ...allVideos.filter((v) => v.youtubeId).map((v) => u(`/video/${v.slug}`, v.date)),
    ...authors.map((a) => u(`/author/${a.slug}`)),
    ...allPosts.map((p) => u(postHref(p), p.date)),
  ];
}
