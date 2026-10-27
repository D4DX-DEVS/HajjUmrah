// Add a post from one text file.
//   node scripts/add-post.mjs my-post.txt [--dry-run] [--push]
//
// File format: front matter between --- lines, then the body (HTML, or plain text where a blank line starts a new paragraph).
//   ---
//   title: Title of the post              (required)
//   category: articles                     (required: articles, fatwa, fiqh, hajj-umrah, history-culture, rituals)
//   author: Author Name                    (required; existing authors are matched by name or slug)
//   slug: url-part                         (required unless the title is plain English)
//   date: 2026-10-27                       (optional, default now)
//   tags: Hajj, Tawaf                      (optional, comma separated)
//   image: photo.jpg                       (optional: a file next to this one, or /uploads/... or a full URL)
//   excerpt: Short summary                 (optional, default: first 200 characters)
//   ---
//   Body...
//
// Then rebuild/deploy (or use --push to commit and push, which triggers a Git deploy).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
const push = args.includes("--push");
const fail = (m) => { console.error("Error: " + m); process.exit(1); };
if (!file) fail("usage: node scripts/add-post.mjs <post-file> [--dry-run] [--push]");

const read = (n) => JSON.parse(fs.readFileSync(`content/${n}.json`, "utf8"));
const posts = read("posts"), cats = read("categories"), tags = read("tags");
const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const m = fs.readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
if (!m) fail("the file must start with front matter between --- lines");
const meta = Object.fromEntries(
  m[1].split(/\r?\n/).filter((l) => l.includes(":") && !l.trim().startsWith("#")).map((l) => [l.slice(0, l.indexOf(":")).trim().toLowerCase(), l.slice(l.indexOf(":") + 1).trim()]),
);
const body = m[2].trim();
if (!meta.title) fail("title is required");
if (!body) fail("the post body is empty");

const category = meta.category;
if (!cats.some((c) => c.slug === category)) fail(`category must be one of: ${cats.map((c) => c.slug).join(", ")}`);

const slug = meta.slug || slugify(meta.title);
if (!slug) fail("add a slug: line (the title has no English letters to build one from)");
if (posts.some((p) => dec(p.slug) === slug)) fail(`a post with slug "${slug}" already exists`);

// author
if (!meta.author) fail("author is required");
const known = [...new Map(posts.map((p) => [p.author.slug, p.author])).values()];
let author = known.find((a) => a.name === meta.author || a.slug === meta.author);
if (!author) {
  const s = slugify(meta.author);
  if (!s) fail("new author needs an English name (or use an existing author's name or slug)");
  author = { id: Math.max(...known.map((a) => a.id)) + 1, name: meta.author, slug: s };
}

// date
const d = meta.date ? new Date(meta.date) : new Date();
if (Number.isNaN(d.getTime())) fail(`bad date "${meta.date}"`);
const date = d.toISOString().slice(0, 19);

// image
let image = null;
if (meta.image) {
  if (/^(https?:\/\/|\/)/.test(meta.image)) image = meta.image;
  else {
    const src = path.resolve(path.dirname(file), meta.image);
    if (!fs.existsSync(src)) fail(`image file not found: ${src}`);
    const rel = `${date.slice(0, 4)}/${date.slice(5, 7)}/${path.basename(src)}`;
    image = `/uploads/${rel}`;
    if (!dry) { fs.mkdirSync(path.dirname(`public${image}`), { recursive: true }); fs.copyFileSync(src, `public${image}`); }
  }
}

// body -> HTML
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const content = /<\/?[a-z][\s\S]*?>/i.test(body)
  ? body
  : body.split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("\n");
// plain text for the default excerpt (the site shows excerpts as text, so no HTML entities here)
const text = content
  .replace(/<[^>]+>/g, " ")
  .replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", "#39": "'" })[e])
  .replace(/\s+/g, " ")
  .trim();

// tags
const tagSlugs = [];
for (const t of (meta.tags ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
  const want = t.toLowerCase();
  let tag = tags.find((x) => x.name.toLowerCase() === want || dec(x.slug) === want || dec(x.slug) === slugify(t));
  if (tag) tag.count++;
  else {
    tag = { id: Math.max(0, ...tags.map((x) => x.id)) + 1, slug: slugify(t) || want.replace(/\s+/g, "-"), name: t, count: 1 };
    tags.push(tag);
  }
  if (!tagSlugs.includes(tag.slug)) tagSlugs.push(tag.slug);
}

const post = {
  id: Math.max(...posts.map((p) => p.id)) + 1,
  slug,
  category,
  title: meta.title,
  date,
  excerpt: meta.excerpt || text.slice(0, 200),
  content,
  image,
  author,
  categories: [category],
  tags: tagSlugs,
};

console.log(`${dry ? "[dry run] " : ""}Adding: /${category}/${slug}  (${meta.title})  by ${author.name}, ${date}, tags: ${tagSlugs.join(", ") || "none"}${image ? ", image " + image : ""}`);
if (dry) process.exit(0);

posts.push(post);
fs.writeFileSync("content/posts.json", JSON.stringify(posts, null, 1));
fs.writeFileSync("content/tags.json", JSON.stringify(tags, null, 1));
console.log("Saved. Next: npm run build (check it), then deploy.");
if (image?.startsWith("/uploads/")) console.log("If images are served from R2 (NEXT_PUBLIC_MEDIA_URL is set), also run: node scripts/upload-r2.mjs");

if (push) {
  const run = (...a) => { const r = spawnSync("git", a, { stdio: "inherit" }); if (r.status) fail(`git ${a[0]} failed`); };
  run("add", "content", "public/uploads");
  run("commit", "-m", `Add post: ${meta.title}`);
  run("push");
}
