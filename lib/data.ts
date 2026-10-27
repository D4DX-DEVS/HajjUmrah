import fs from "node:fs";
import path from "node:path";
import categories from "@/content/categories.json";
import pages from "@/content/pages.json";
import videos from "@/content/videos.json";
import tags from "@/content/tags.json";
import authorBios from "@/content/authors.json";

export type Post = {
  id: number;
  slug: string;
  category: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: { id: number; name: string; slug: string };
  categories: string[];
  tags: string[];
};

// One JSON file per post (content/posts/<id>.json), read at build time.
const postsDir = path.join(process.cwd(), "content/posts");
const posts: Post[] = fs
  .readdirSync(postsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), "utf8")));

// WP exported some slugs percent-encoded; Next hands route params over decoded, so store them decoded.
const dec = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
// Optional: serve /uploads/** from R2 (bucket keys mirror the paths). Set at build time, e.g. https://media.example.com
const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
const media = (s: string) => (MEDIA ? s.replace(/(^|[\s"',(])\/uploads\//g, `$1${MEDIA}/uploads/`) : s);
export const allPosts = posts
  .map((p) => ({ ...p, slug: dec(p.slug), tags: p.tags.map(dec), image: p.image && media(p.image), content: media(p.content) })).sort((a, b) => b.date.localeCompare(a.date));
export const allCategories = categories;
export const allVideos = videos.map((v) => ({ ...v, slug: dec(v.slug) }));
export const getVideo = (slug: string) => allVideos.find((v) => v.slug === dec(slug));
export const getPage = (slug: string) => pages.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const postsIn = (cat: string) => allPosts.filter((p) => p.categories.includes(cat));
export const getPost = (cat: string, slug: string) => allPosts.find((p) => p.category === cat && p.slug === dec(slug));
export const authors = [...new Map(allPosts.map((p) => [p.author.slug, p.author])).values()];
export const postsBy = (slug: string) => allPosts.filter((p) => p.author.slug === slug);
export const postHref = (p: Post) => `/${p.category}/${p.slug}`;
export const allTags = tags.map((t) => ({ ...t, slug: dec(t.slug) }));
export const getTag = (slug: string) => allTags.find((t) => t.slug === dec(slug));
export const postsTagged = (slug: string) => allPosts.filter((p) => p.tags.includes(slug));
export const authorBio = (slug: string) => authorBios.find((a) => a.slug === slug)?.description;
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
