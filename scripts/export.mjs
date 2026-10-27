// LEGACY: one-off WordPress import. Posts now live in content/posts/<id>.json, so do not re-run this (it writes content/posts.json).
// One-off WP -> local export. Run: node scripts/export.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://hajj.islamonlive.in";
const API = `${ORIGIN}/wp-json/wp/v2`;
const OUT = path.resolve("content");
const PUB = path.resolve("public");

async function getAll(route, extra = "") {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await fetch(`${API}/${route}?per_page=100&page=${page}${extra}`);
    if (r.status === 400) break; // past last page
    if (!r.ok) throw new Error(`${route} ${r.status}`);
    const rows = await r.json();
    all.push(...rows);
    if (page >= Number(r.headers.get("x-wp-totalpages"))) break;
  }
  return all;
}

const images = new Set();
// Rewrites wp-content/uploads URLs to local /uploads/... and queues download.
function localize(html) {
  return html
    .replace(/https?:\/\/hajj\.islamonlive\.in\/wp-content\/uploads\/([^\s"'<>)]+)/g, (_, p) => {
      images.add(p);
      return `/uploads/${p}`;
    })
    .replace(/\s(srcset|sizes)="[^"]*"/g, (m) => m); // srcset URLs were rewritten above too
}
const local = (u) => (u ? localize(u) : null);

const [posts, cats, pages, videos] = await Promise.all([
  getAll("posts", "&_embed=author,wp:featuredmedia"),
  getAll("categories"),
  getAll("pages"),
  getAll("aiovg_videos", "&_embed=wp:featuredmedia"),
]);

const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
const categories = cats
  .filter((c) => c.count > 0)
  .map((c) => ({ id: c.id, slug: c.slug, name: c.name.replace(/&amp;/g, "&"), count: c.count }));

const outPosts = posts.map((p) => {
  const cat = catById[p.categories[0]] ?? catById[1];
  return {
    id: p.id,
    slug: p.slug,
    category: cat.slug,
    title: p.title.rendered,
    date: p.date,
    excerpt: p.excerpt.rendered.replace(/<[^>]+>/g, "").trim(),
    content: localize(p.content.rendered),
    image: local(p._embedded?.["wp:featuredmedia"]?.[0]?.source_url),
    author: { id: p.author, name: p._embedded?.author?.[0]?.name ?? "Web Desk", slug: p._embedded?.author?.[0]?.slug ?? "web-desk" },
    categories: p.categories.map((id) => catById[id]?.slug).filter(Boolean),
  };
});

const outPages = pages
  .filter((p) => ["about", "contact", "privacy-policy"].includes(p.slug))
  .map((p) => ({ slug: p.slug, title: p.title.rendered, content: localize(p.content.rendered) }));

const outVideos = [];
for (const v of videos) {
  const html = await (await fetch(v.link)).text();
  const yt = html.match(/youtube\.com\/vi\/([\w-]{11})\//)?.[1] ?? html.match(/youtube\.com\/embed\/([\w-]{11})/)?.[1];
  outVideos.push({
    slug: v.slug,
    title: v.title.rendered,
    date: v.date,
    youtubeId: yt ?? null,
    image: local(v._embedded?.["wp:featuredmedia"]?.[0]?.source_url),
  });
}

await fs.mkdir(OUT, { recursive: true });
for (const [name, data] of Object.entries({ posts: outPosts, categories, pages: outPages, videos: outVideos })) {
  await fs.writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 1));
}

// logo + favicons
for (const p of ["2022/06/logo-hajj.png", "2022/06/cropped-icon-192x192.png", "2022/06/cropped-icon-180x180.png"]) images.add(p);

let ok = 0;
const failed = [];
await Promise.all(
  [...images].map(async (p) => {
    const dest = path.join(PUB, "uploads", decodeURI(p).split("?")[0]);
    try {
      const r = await fetch(`${ORIGIN}/wp-content/uploads/${p}`);
      if (!r.ok) throw new Error(r.status);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) {
      failed.push(`${p} ${e.message}`);
    }
  }),
);
console.log({ posts: outPosts.length, categories: categories.length, pages: outPages.length, videos: outVideos.length, images: ok, failed });
console.log("videos without youtube id:", outVideos.filter((v) => !v.youtubeId).length);
