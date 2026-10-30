import { cache } from "react";
import { db } from "@/lib/server/d1";

// Posts without the body (it is fetched on its own page); the site list pages never need it.
export type Post = {
  id: number;
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt: string;
  image: string | null;
  author: { id: number; name: string; slug: string };
  categories: string[];
  tags: string[];
};

type Row = { id: number; slug: string; category: string; title: string; date: string; excerpt: string; image: string | null; author_id: number; author_name: string; author_slug: string; categories: string; tags: string };
type Category = { id: number; slug: string; name: string; count: number };
type Tag = { id: number; slug: string; name: string; count: number };
type Video = { slug: string; title: string; date: string; youtubeId: string; image: string | null };

// WP exported some slugs percent-encoded; Next hands route params over decoded, so store them decoded.
const dec = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
// Optional: serve /uploads/** from R2 (bucket keys mirror the paths). Set at build time, e.g. https://media.example.com
const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
const media = (s: string) => (MEDIA ? s.replace(/(^|[\s"',(])\/uploads\//g, `$1${MEDIA}/uploads/`) : s);

// All site data in two queries, shared by everything rendered for one request.
export const getData = cache(async () => {
  const [p, d] = await Promise.all([
    db.prepare("SELECT id, slug, category, title, date, excerpt, image, author_id, author_name, author_slug, categories, tags FROM posts ORDER BY date DESC").bind().all<Row>(),
    db.prepare("SELECT key, json FROM docs").bind().all<{ key: string; json: string }>(),
  ]);
  const doc = <T,>(key: string): T[] => JSON.parse(d.results.find((r) => r.key === key)?.json ?? "[]");
  const allPosts: Post[] = p.results.map((r) => ({
    id: r.id, slug: dec(r.slug), category: r.category, title: r.title, date: r.date, excerpt: r.excerpt, image: r.image && media(r.image),
    author: { id: r.author_id, name: r.author_name, slug: r.author_slug },
    categories: JSON.parse(r.categories), tags: (JSON.parse(r.tags) as string[]).map(dec),
  }));
  const allCategories = doc<Category>("categories");
  const allVideos = doc<Video>("videos").map((v) => ({ ...v, slug: dec(v.slug) }));
  const allTags = doc<Tag>("tags").map((t) => ({ ...t, slug: dec(t.slug) }));
  const bios = doc<{ slug: string; description: string }>("authors");
  return {
    allPosts, allCategories, allVideos, allTags,
    getVideo: (slug: string) => allVideos.find((v) => v.slug === dec(slug)),
    getCategory: (slug: string) => allCategories.find((c) => c.slug === slug),
    postsIn: (cat: string) => allPosts.filter((x) => x.categories.includes(cat)),
    getPost: (cat: string, slug: string) => allPosts.find((x) => x.category === cat && x.slug === dec(slug)),
    authors: [...new Map(allPosts.map((x) => [x.author.slug, x.author])).values()],
    postsBy: (slug: string) => allPosts.filter((x) => x.author.slug === slug),
    getTag: (slug: string) => allTags.find((t) => t.slug === dec(slug)),
    postsTagged: (slug: string) => allPosts.filter((x) => x.tags.includes(slug)),
    authorBio: (slug: string) => bios.find((a) => a.slug === slug)?.description,
  };
});

export async function getPostContent(id: number) {
  const r = await db.prepare("SELECT content FROM posts WHERE id = ?").bind(id).first<{ content: string }>();
  return media(r?.content ?? "");
}

export const postHref = (p: Post) => `/${p.category}/${p.slug}`;
export const SITE = "https://hajj.islamonlive.in";
export const PER_PAGE = 12;
export const pageCount = (n: number) => Math.max(1, Math.ceil(n / PER_PAGE));
export const slicePage = <T,>(rows: T[], n: number) => rows.slice((n - 1) * PER_PAGE, n * PER_PAGE);
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
export const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
