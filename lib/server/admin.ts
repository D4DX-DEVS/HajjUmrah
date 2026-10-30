import { d1Configured, db } from "./d1";
import { getData } from "@/lib/data";
import { r2Configured, r2Exists, r2Put, purgePages } from "./r2";
import { sanitizeHtml } from "./sanitize";

// Admin API (/api/admin/*). One shared password -> signed HttpOnly cookie. Posts and videos are rows in D1;
// every change also purges the stored pages (purgePages), so it is live at once.
// Env: ADMIN_PASSWORD. Bindings: DB, MEDIA (./d1, ./r2).

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const SESSION_SECONDS = 12 * 3600;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 60;
const WINDOW_SECONDS = 900;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keeps uploads small; the Worker accepts far more

const enc = new TextEncoder();
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });
const bad = (msg: string, status = 400) => json({ error: msg }, status);

// ---------- auth ----------
const sha256 = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
  return [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeSession(password: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${exp}.${await hmacHex(password, `session:${exp}`)}`;
}
async function hasSession(req: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const tok = /(?:^|;\s*)admin_session=([^;]+)/.exec(req.headers.get("cookie") ?? "")?.[1];
  const [exp, sig] = (tok ?? "").split(".");
  if (!exp || !sig || !(Number(exp) > Date.now() / 1000)) return false;
  return safeEqual(enc.encode(sig), enc.encode(await hmacHex(password, `session:${exp}`)));
}
const cookie = (value: string, maxAge: number) => `admin_session=${value}; Max-Age=${maxAge}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict`;
// Cloudflare sets cf-connecting-ip itself; clients cannot spoof it
const clientIp = (req: Request) => req.headers.get("cf-connecting-ip") ?? "unknown";

async function login(req: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return bad("admin is not configured", 503);
  if (!d1Configured()) return bad("login is unavailable: database is not configured", 503);
  const ip = clientIp(req);
  const since = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;
  try {
    const mine = await db.prepare("SELECT COUNT(*) AS n FROM admin_login_attempts WHERE ip = ? AND at > ?").bind(ip, since).first<{ n: number }>();
    const all = await db.prepare("SELECT COUNT(*) AS n FROM admin_login_attempts WHERE at > ?").bind(since).first<{ n: number }>();
    if ((mine?.n ?? 0) >= MAX_FAILS_PER_IP || (all?.n ?? 0) >= MAX_FAILS_TOTAL) return json({ error: "too many attempts, try again in 15 minutes" }, 429, { "retry-after": String(WINDOW_SECONDS) });
    const b = (await req.json().catch(() => null)) as { password?: unknown } | null;
    const pw = typeof b?.password === "string" ? b.password : "";
    if (!safeEqual(await sha256(pw), await sha256(password))) {
      await db.prepare("INSERT INTO admin_login_attempts (ip, at) VALUES (?, ?)").bind(ip, Math.floor(Date.now() / 1000)).run();
      await db.prepare("DELETE FROM admin_login_attempts WHERE at < ?").bind(since - 86400).run();
      return bad("wrong password", 401);
    }
    await db.prepare("DELETE FROM admin_login_attempts WHERE ip = ?").bind(ip).run();
  } catch (e) {
    console.error("admin login: D1 error", e);
    return bad("login is unavailable: database error (run npm run db:migrate)", 503); // fail closed
  }
  return json({ ok: true }, 200, { "set-cookie": cookie(await makeSession(password), SESSION_SECONDS) });
}

// ---------- validation ----------
const dec = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
// categories, authors, tags and post ids/slugs, for validation
async function siteIndex() {
  const d = await getData();
  return { categories: d.allCategories, authors: d.authors, tags: d.allTags, posts: d.allPosts };
}
const text = (v: unknown, min: number, max: number, label: string) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < min || s.length > max) throw new HttpError(400, `${label} must be ${min}-${max} characters`);
  return s;
};
const SLUG = /^[^\s/?#%\\]+$/;
const slugOk = (s: string, label: string) => {
  if (!SLUG.test(s) || s.length > 200) throw new HttpError(400, `${label} cannot contain spaces or / ? # %`);
  return s;
};

async function buildPost(input: Record<string, unknown>, id: number) {
  const idx = await siteIndex();
  const title = text(input.title, 1, 300, "title");
  const slug = slugOk(dec(text(input.slug, 1, 200, "slug")), "slug"); // imported slugs may be percent-encoded; store them decoded
  if (slug === "page") throw new HttpError(400, 'the slug "page" is reserved');
  if (idx.posts.some((p) => p.id !== id && dec(p.slug) === slug)) throw new HttpError(400, `slug "${slug}" is already used by another post`);
  const category = String(input.category ?? "");
  if (!idx.categories.some((c) => c.slug === category)) throw new HttpError(400, "unknown category");
  const extra = Array.isArray(input.categories) ? (input.categories as unknown[]).map(String) : [];
  if (extra.some((c) => !idx.categories.some((x) => x.slug === c))) throw new HttpError(400, "unknown category");
  const categories = [category, ...new Set(extra.filter((c) => c !== category))]; // primary first; it decides the URL

  const a = (input.author ?? {}) as { name?: unknown; slug?: unknown };
  const aSlug = String(a.slug ?? "");
  const known = idx.authors.find((x) => x.slug === aSlug);
  if (!known && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(aSlug)) throw new HttpError(400, "author slug must be lowercase English letters, numbers and dashes");
  const author = known ?? { id: Math.floor(Date.now() / 1000), name: text(a.name, 1, 100, "author name"), slug: aSlug };

  const dm = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/.exec(String(input.date ?? ""));
  if (!dm || Number.isNaN(new Date(dm[1] + ":00Z").getTime())) throw new HttpError(400, "date must look like 2026-10-27T09:30");
  const date = dm[1] + (dm[2] ?? ":00");

  const content = sanitizeHtml(text(input.content, 1, 500_000, "body"));
  const plain = content.replace(/<[^>]+>/g, " ").replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", "#39": "'" })[e as string] ?? "").replace(/\s+/g, " ").trim();
  if (!plain && !/<(img|iframe)\b/i.test(content)) throw new HttpError(400, "the body is empty");
  const excerpt = typeof input.excerpt === "string" && input.excerpt.trim() ? text(input.excerpt, 1, 20000, "excerpt") : plain.slice(0, 200);

  const image = input.image == null || input.image === "" ? null : String(input.image);
  if (image !== null && !/^(\/uploads\/[\w./-]+|https:\/\/[^\s"'<>]+)$/.test(image)) throw new HttpError(400, "image must be an /uploads/... path or an https:// URL");

  const rawTags = Array.isArray(input.tags) ? input.tags : [];
  if (rawTags.length > 20) throw new HttpError(400, "at most 20 tags");
  const tags: { slug: string; name: string }[] = [];
  for (const t of rawTags as { slug?: unknown; name?: unknown }[]) {
    const s = slugOk(dec(text(t?.slug, 1, 240, "tag slug")), "tag slug"); // imported tag slugs may be percent-encoded
    if (s.length > 80) throw new HttpError(400, "tag slug is too long");
    if (!tags.some((x) => x.slug === s)) tags.push({ slug: s, name: text(t?.name, 1, 80, "tag name") });
  }
  const newTags = tags.filter((t) => !idx.tags.some((x) => x.slug === t.slug));
  const post = { id, slug, category, title, date, excerpt, content, image, author, categories, tags: tags.map((t) => t.slug) };
  return { post, newTags };
}

async function addTags(tags: { slug: string; name: string }[]) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const row = await db.prepare("SELECT json, rev FROM docs WHERE key = 'tags'").bind().first<{ json: string; rev: number }>();
    if (!row) throw new HttpError(500, "tags are missing from the database");
    const list = JSON.parse(row.json) as { id: number; slug: string; name: string; count: number }[];
    let id = Math.max(0, ...list.map((t) => t.id));
    const before = list.length;
    for (const t of tags) if (!list.some((x) => dec(x.slug) === t.slug)) list.push({ id: ++id, slug: t.slug, name: t.name, count: 1 });
    if (list.length === before) return;
    const r = await db.prepare("UPDATE docs SET json = ?, rev = rev + 1 WHERE key = 'tags' AND rev = ?").bind(JSON.stringify(list), row.rev).run();
    if (r.meta.changes) return;
    if (attempt) throw new HttpError(409, "conflict: tags changed, retry");
  }
}

// ---------- handlers ----------
const idParam = (url: URL) => {
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "bad id");
  return id;
};
// `sha` is the row's revision number: the editor sends back the one it loaded, and a stale one means someone else saved first
const REV = /^\d+$/;

type PostRow = { id: number; slug: string; category: string; title: string; date: string; excerpt: string; content: string; image: string | null; author_id: number; author_name: string; author_slug: string; categories: string; tags: string; rev: number };

async function getPostHandler(url: URL) {
  const r = await db.prepare("SELECT * FROM posts WHERE id = ?").bind(idParam(url)).first<PostRow>();
  if (!r) return bad("post not found", 404);
  const { id, slug, category, title, date, excerpt, content, image } = r;
  const post = { id, slug, category, title, date, excerpt, content, image, author: { id: r.author_id, name: r.author_name, slug: r.author_slug }, categories: JSON.parse(r.categories), tags: JSON.parse(r.tags) };
  return json({ sha: String(r.rev), post });
}

async function savePost(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: number; sha?: string; post?: Record<string, unknown> } | null;
  if (!body?.post || typeof body.post !== "object") return bad("missing post");
  const updating = body.id != null;
  if (updating && (!Number.isInteger(body.id) || !REV.test(body.sha ?? ""))) return bad("update needs id and sha");
  const id = updating ? (body.id as number) : (await db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM posts").bind().first<{ n: number }>())!.n;
  const { post, newTags } = await buildPost(body.post, id);
  if (newTags.length) await addTags(newTags);
  const v = [post.slug, post.category, post.title, post.date, post.excerpt, post.content, post.image, post.author.id, post.author.name, post.author.slug, JSON.stringify(post.categories), JSON.stringify(post.tags)];
  let rev = 1;
  if (updating) {
    const r = await db
      .prepare("UPDATE posts SET slug = ?, category = ?, title = ?, date = ?, excerpt = ?, content = ?, image = ?, author_id = ?, author_name = ?, author_slug = ?, categories = ?, tags = ?, rev = rev + 1 WHERE id = ? AND rev = ?")
      .bind(...v, id, Number(body.sha))
      .run();
    if (!r.meta.changes) return bad("conflict: the post changed, reload and retry", 409);
    rev = Number(body.sha) + 1;
  } else {
    await db
      .prepare("INSERT INTO posts (id, slug, category, title, date, excerpt, content, image, author_id, author_name, author_slug, categories, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, ...v)
      .run();
  }
  await purgePages();
  return json({ ok: true, id, sha: String(rev) });
}

async function deletePost(url: URL) {
  const sha = url.searchParams.get("sha") ?? "";
  if (!REV.test(sha)) return bad("missing sha");
  const r = await db.prepare("DELETE FROM posts WHERE id = ? AND rev = ?").bind(idParam(url), Number(sha)).run();
  if (!r.meta.changes) return bad("conflict: the post changed or is already gone, reload", 409);
  await purgePages();
  return json({ ok: true });
}

async function getVideos() {
  const row = await db.prepare("SELECT json, rev FROM docs WHERE key = 'videos'").bind().first<{ json: string; rev: number }>();
  return row ? json({ sha: String(row.rev), videos: JSON.parse(row.json) }) : bad("videos are missing from the database", 500);
}

async function saveVideos(req: Request) {
  const b = (await req.json().catch(() => null)) as { sha?: string; videos?: Record<string, unknown>[] } | null;
  if (!REV.test(b?.sha ?? "") || !Array.isArray(b?.videos) || b.videos.length > 200) return bad("missing sha or videos");
  const seen = new Set<string>();
  const videos = b.videos.map((v) => {
    const slug = slugOk(dec(text(v.slug, 1, 200, "video slug")), "video slug");
    if (seen.has(slug)) throw new HttpError(400, `duplicate video slug "${slug}"`);
    seen.add(slug);
    const youtubeId = String(v.youtubeId ?? "");
    if (!/^[\w-]{11}$/.test(youtubeId)) throw new HttpError(400, "YouTube id must be 11 characters");
    const d = String(v.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(d) || Number.isNaN(new Date(d + "Z").getTime())) throw new HttpError(400, "video date must look like 2026-10-27T09:30:00");
    return { slug, title: text(v.title, 1, 300, "video title"), date: d, youtubeId, image: null };
  });
  const r = await db.prepare("UPDATE docs SET json = ?, rev = rev + 1 WHERE key = 'videos' AND rev = ?").bind(JSON.stringify(videos), Number(b.sha)).run();
  if (!r.meta.changes) return bad("conflict: the videos changed, reload and retry", 409);
  await purgePages();
  return json({ ok: true, sha: String(Number(b.sha) + 1) });
}

const MAGIC: [string, number[], string][] = [
  ["image/jpeg", [0xff, 0xd8, 0xff], "jpg"],
  ["image/png", [0x89, 0x50, 0x4e, 0x47], "png"],
  ["image/gif", [0x47, 0x49, 0x46, 0x38], "gif"],
];
async function upload(req: Request) {
  if (!r2Configured()) return bad("image storage is not configured", 503);
  const len = Number(req.headers.get("content-length") ?? 0);
  if (!len || len > MAX_IMAGE_BYTES) return bad("image must be under 4 MB");
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_IMAGE_BYTES) return bad("image must be under 4 MB");
  const head = new Uint8Array(buf.slice(0, 12));
  let type = MAGIC.find(([, m]) => m.every((b, i) => head[i] === b))?.[0];
  let ext = MAGIC.find(([t]) => t === type)?.[2];
  if (!type && String.fromCharCode(...head.slice(0, 4)) === "RIFF" && String.fromCharCode(...head.slice(8, 12)) === "WEBP") [type, ext] = ["image/webp", "webp"];
  if (!type || !ext) return bad("only JPEG, PNG, GIF or WebP images are allowed");
  const base = dec(req.headers.get("x-filename") ?? "image").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  const now = new Date();
  let key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}.${ext}`;
  if (await r2Exists(key)) key = key.replace(base, `${base}-${Date.now().toString(36)}`);
  await r2Put(key, buf, type);
  const mediaUrl = (process.env.MEDIA_URL ?? process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
  return json({ ok: true, path: `/${key}`, url: `${mediaUrl}/${key}` });
}

export async function handleAdmin(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/+$/, "");
  try {
    if (route === "/api/admin/login") return req.method === "POST" ? await login(req) : bad("method not allowed", 405);
    if (!(await hasSession(req))) return bad("not logged in", 401);
    if (route === "/api/admin/logout") return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
    if (req.method !== "GET" && req.headers.get("x-admin-request") !== "1") return bad("forbidden", 403); // CSRF guard
    switch (`${req.method} ${route}`) {
      case "GET /api/admin/session": return json({ ok: true });
      case "GET /api/admin/post": return await getPostHandler(url);
      case "POST /api/admin/post": return await savePost(req);
      case "DELETE /api/admin/post": return await deletePost(url);
      case "GET /api/admin/videos": return await getVideos();
      case "POST /api/admin/videos": return await saveVideos(req);
      case "POST /api/admin/upload": return await upload(req);
    }
    return bad("not found", 404);
  } catch (e) {
    if (e instanceof HttpError) return bad(e.message, e.status === 422 ? 409 : e.status === 503 || e.status < 500 ? e.status : 502);
    console.error("admin error", e);
    return bad("server error", 500);
  }
}
