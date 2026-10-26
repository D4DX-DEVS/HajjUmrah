// One-off WP -> local sync of what export.mjs missed. Run: node scripts/sync-extras.mjs
// - post category = first path segment of the live permalink (so URLs match the WP site exactly)
// - tags: content/tags.json + post.tags (slugs)
// - author bios: content/authors.json (only authors that have a description)
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://hajj.islamonlive.in/wp-json/wp/v2";
const OUT = path.resolve("content");

async function getAll(route, fields) {
  const all = [];
  for (let page = 1; ; page++) {
    const r = await fetch(`${API}/${route}?per_page=100&page=${page}&_fields=${fields}`);
    if (r.status === 400) break;
    if (!r.ok) throw new Error(`${route} ${r.status}`);
    all.push(...(await r.json()));
    if (page >= Number(r.headers.get("x-wp-totalpages"))) break;
  }
  return all;
}

const read = async (n) => JSON.parse(await fs.readFile(path.join(OUT, `${n}.json`), "utf8"));
const write = (n, d) => fs.writeFile(path.join(OUT, `${n}.json`), JSON.stringify(d, null, 1));

const [posts, cats, wpPosts, wpTags, wpUsers] = await Promise.all([
  read("posts"),
  read("categories"),
  getAll("posts", "id,link,tags"),
  getAll("tags", "id,slug,name,count"),
  getAll("users", "id,slug,name,description"),
]);

const catSlugs = new Set(cats.map((c) => c.slug));
const tagById = Object.fromEntries(wpTags.map((t) => [t.id, t]));
const live = Object.fromEntries(wpPosts.map((p) => [p.id, p]));

let moved = 0;
for (const p of posts) {
  const w = live[p.id];
  if (!w) continue;
  const seg = decodeURIComponent(new URL(w.link).pathname.split("/").filter(Boolean)[0]);
  if (catSlugs.has(seg) && seg !== p.category) {
    p.category = seg;
    moved++;
  }
  if (!p.categories.includes(p.category)) p.categories.unshift(p.category);
  p.tags = w.tags.map((id) => tagById[id]?.slug).filter(Boolean);
}

const tags = wpTags.filter((t) => t.count > 0).map(({ id, slug, name, count }) => ({ id, slug, name, count }));
const used = new Set(posts.flatMap((p) => p.tags));
const authors = wpUsers.filter((u) => u.description?.trim()).map(({ slug, name, description }) => ({ slug, name, description }));

await write("posts", posts);
await write("tags", tags.filter((t) => used.has(t.slug)));
await write("authors", authors);
console.log({ postsMoved: moved, tags: tags.length, tagsUsed: used.size, authorsWithBio: authors.length });
