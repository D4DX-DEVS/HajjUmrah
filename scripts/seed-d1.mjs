// Loads content/*.json into D1 (posts, categories, tags, videos, author bios).
//   node scripts/seed-d1.mjs --local    the local copy used by `npm run dev` / `npm run preview`
//   node scripts/seed-d1.mjs --remote   the live database (refuses if posts already exist: it would overwrite admin edits)
// D1 limits a statement to 100 KB, so long post bodies are inserted empty and appended in chunks.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];
if (target !== "--local" && target !== "--remote") throw new Error("usage: node scripts/seed-d1.mjs --local|--remote");

const read = (f) => JSON.parse(fs.readFileSync(path.join("content", f), "utf8"));
const q = (v) => (v == null ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const CHUNK = 20000; // characters; Malayalam is 3 bytes each in UTF-8, so a chunk stays under 100 KB

const sql = [];
const dir = path.join("content", "posts");
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const cols = [p.id, p.slug, p.category, p.title, p.date, p.excerpt, "", p.image, p.author.id, p.author.name, p.author.slug, JSON.stringify(p.categories), JSON.stringify(p.tags)];
  sql.push(`INSERT INTO posts (id, slug, category, title, date, excerpt, content, image, author_id, author_name, author_slug, categories, tags) VALUES (${cols.map(q).join(", ")});`);
  for (let i = 0; i < p.content.length; i += CHUNK) sql.push(`UPDATE posts SET content = content || ${q(p.content.slice(i, i + CHUNK))} WHERE id = ${p.id};`);
}
for (const [key, file] of [["categories", "categories.json"], ["tags", "tags.json"], ["videos", "videos.json"], ["authors", "authors.json"]]) {
  sql.push(`INSERT INTO docs (key, json) VALUES (${q(key)}, ${q(JSON.stringify(read(file)))});`);
}

const wrangler = (args) => execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "hajjumra", target, ...args], { encoding: "utf8" });
if (target === "--remote") {
  const out = wrangler(["--json", "--command", "SELECT COUNT(*) AS n FROM posts"]);
  if (JSON.parse(out)[0].results[0].n > 0) throw new Error("posts already exist in the remote database; refusing to seed");
}
const file = path.join(".wrangler", "seed.sql");
fs.mkdirSync(".wrangler", { recursive: true });
fs.writeFileSync(file, sql.join("\n"));
console.log(`${sql.length} statements`);
console.log(wrangler(["--file", file]));
