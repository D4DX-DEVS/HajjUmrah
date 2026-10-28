import { d1Configured, db } from "./d1";
import { GitHubError, deleteFile, getFile, listNames, putFile } from "./github";
import { r2Configured, r2Exists, r2Put } from "./r2";
import { sanitizeHtml } from "./sanitize";

// Admin API (/api/admin/*). One shared password -> signed HttpOnly cookie. Saving a post commits a JSON file
// to the GitHub repo; the connected Git deploy then rebuilds the site.
// Env: ADMIN_PASSWORD, plus the D1 / R2 / GitHub variables read in ./d1, ./r2 and ./github.

const SESSION_SECONDS = 12 * 3600;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 60;
const WINDOW_SECONDS = 900;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel Functions reject request bodies over 4.5 MB

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
// Vercel puts the client address first in x-forwarded-for
const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

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
type Index = {
  categories: { slug: string; name: string }[];
  authors: { id: number; name: string; slug: string }[];
  tags: { slug: string; name: string }[];
  posts: { id: number; slug: string }[];
};
const dec = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
// the static site data written at build time (app/admin/index.json)
async function siteIndex(req: Request): Promise<Index> {
  const r = await fetch(new URL("/admin/index.json", req.url));
  if (!r.ok) throw new GitHubError(500, "site index missing (build the site first)");
  return (await r.json()) as Index;
}
const text = (v: unknown, min: number, max: number, label: string) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < min || s.length > max) throw new GitHubError(400, `${label} must be ${min}-${max} characters`);
  return s;
};
const SLUG = /^[^\s/?#%\\]+$/;
const slugOk = (s: string, label: string) => {
  if (!SLUG.test(s) || s.length > 200) throw new GitHubError(400, `${label} cannot contain spaces or / ? # %`);
  return s;
};
const msg = (s: string) => s.replace(/\s+/g, " ").slice(0, 80);

async function buildPost(req: Request, input: Record<string, unknown>, id: number) {
  const idx = await siteIndex(req);
  const title = text(input.title, 1, 300, "title");
  const slug = slugOk(dec(text(input.slug, 1, 200, "slug")), "slug"); // imported slugs may be percent-encoded; store them decoded
  if (slug === "page") throw new GitHubError(400, 'the slug "page" is reserved');
  if (idx.posts.some((p) => p.id !== id && dec(p.slug) === slug)) throw new GitHubError(400, `slug "${slug}" is already used by another post`);
  const category = String(input.category ?? "");
  if (!idx.categories.some((c) => c.slug === category)) throw new GitHubError(400, "unknown category");
  const extra = Array.isArray(input.categories) ? (input.categories as unknown[]).map(String) : [];
  if (extra.some((c) => !idx.categories.some((x) => x.slug === c))) throw new GitHubError(400, "unknown category");
  const categories = [category, ...new Set(extra.filter((c) => c !== category))]; // primary first; it decides the URL

  const a = (input.author ?? {}) as { name?: unknown; slug?: unknown };
  const aSlug = String(a.slug ?? "");
  const known = idx.authors.find((x) => x.slug === aSlug);
  if (!known && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(aSlug)) throw new GitHubError(400, "author slug must be lowercase English letters, numbers and dashes");
  const author = known ?? { id: Math.floor(Date.now() / 1000), name: text(a.name, 1, 100, "author name"), slug: aSlug };

  const dm = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(:\d{2})?$/.exec(String(input.date ?? ""));
  if (!dm || Number.isNaN(new Date(dm[1] + ":00Z").getTime())) throw new GitHubError(400, "date must look like 2026-10-27T09:30");
  const date = dm[1] + (dm[2] ?? ":00");

  const content = sanitizeHtml(text(input.content, 1, 500_000, "body"));
  const plain = content.replace(/<[^>]+>/g, " ").replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", "#39": "'" })[e as string] ?? "").replace(/\s+/g, " ").trim();
  if (!plain && !/<(img|iframe)\b/i.test(content)) throw new GitHubError(400, "the body is empty");
  const excerpt = typeof input.excerpt === "string" && input.excerpt.trim() ? text(input.excerpt, 1, 20000, "excerpt") : plain.slice(0, 200);

  const image = input.image == null || input.image === "" ? null : String(input.image);
  if (image !== null && !/^(\/uploads\/[\w./-]+|https:\/\/[^\s"'<>]+)$/.test(image)) throw new GitHubError(400, "image must be an /uploads/... path or an https:// URL");

  const rawTags = Array.isArray(input.tags) ? input.tags : [];
  if (rawTags.length > 20) throw new GitHubError(400, "at most 20 tags");
  const tags: { slug: string; name: string }[] = [];
  for (const t of rawTags as { slug?: unknown; name?: unknown }[]) {
    const s = slugOk(dec(text(t?.slug, 1, 240, "tag slug")), "tag slug"); // imported tag slugs may be percent-encoded
    if (s.length > 80) throw new GitHubError(400, "tag slug is too long");
    if (!tags.some((x) => x.slug === s)) tags.push({ slug: s, name: text(t?.name, 1, 80, "tag name") });
  }
  const newTags = tags.filter((t) => !idx.tags.some((x) => x.slug === t.slug));
  const post = { id, slug, category, title, date, excerpt, content, image, author, categories, tags: tags.map((t) => t.slug) };
  return { post, newTags };
}

async function addTags(tags: { slug: string; name: string }[], why: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const f = await getFile("content/tags.json");
    if (!f) throw new GitHubError(500, "content/tags.json is missing");
    const list = JSON.parse(f.text) as { id: number; slug: string; name: string; count: number }[];
    let id = Math.max(0, ...list.map((t) => t.id));
    const before = list.length;
    for (const t of tags) if (!list.some((x) => dec(x.slug) === t.slug)) list.push({ id: ++id, slug: t.slug, name: t.name, count: 1 });
    if (list.length === before) return; // nothing new: no commit (it would only trigger a rebuild)
    try {
      await putFile("content/tags.json", JSON.stringify(list, null, 1), `Admin: add tags (${msg(why)})`, f.sha);
      return;
    } catch (e) {
      if (!(e instanceof GitHubError) || e.status !== 409 || attempt) throw e; // retry once on a concurrent edit
    }
  }
}

// ---------- handlers ----------
const idParam = (url: URL) => {
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) throw new GitHubError(400, "bad id");
  return id;
};

async function getPostHandler(url: URL) {
  const f = await getFile(`content/posts/${idParam(url)}.json`);
  return f ? json({ sha: f.sha, post: JSON.parse(f.text) }) : bad("post not found", 404);
}

async function savePost(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: number; sha?: string; post?: Record<string, unknown> } | null;
  if (!body?.post || typeof body.post !== "object") return bad("missing post");
  const updating = body.id != null;
  if (updating && (!Number.isInteger(body.id) || !body.sha)) return bad("update needs id and sha");
  const id = updating ? (body.id as number) : Math.max(0, ...(await listNames("content/posts")).map((n) => parseInt(n, 10) || 0)) + 1;
  const { post, newTags } = await buildPost(req, body.post, id);
  if (newTags.length) await addTags(newTags, post.title); // before the post commit, so the last commit has everything
  const r = await putFile(`content/posts/${id}.json`, JSON.stringify(post, null, 1), `Admin: ${updating ? "update" : "add"} post "${msg(post.title)}"`, updating ? body.sha : undefined);
  return json({ ok: true, id, sha: r.sha, commitUrl: r.commitUrl });
}

async function deletePost(url: URL) {
  const sha = url.searchParams.get("sha") ?? "";
  if (!/^[0-9a-f]{40}$/.test(sha)) return bad("missing sha");
  const id = idParam(url);
  const r = await deleteFile(`content/posts/${id}.json`, sha, `Admin: delete post ${id}`);
  return json({ ok: true, commitUrl: r.commitUrl });
}

async function getVideos() {
  const f = await getFile("content/videos.json");
  return f ? json({ sha: f.sha, videos: JSON.parse(f.text) }) : bad("videos.json missing", 500);
}

async function saveVideos(req: Request) {
  const b = (await req.json().catch(() => null)) as { sha?: string; videos?: Record<string, unknown>[] } | null;
  if (!b?.sha || !Array.isArray(b.videos) || b.videos.length > 200) return bad("missing sha or videos");
  const seen = new Set<string>();
  const videos = b.videos.map((v) => {
    const slug = slugOk(dec(text(v.slug, 1, 200, "video slug")), "video slug");
    if (seen.has(slug)) throw new GitHubError(400, `duplicate video slug "${slug}"`);
    seen.add(slug);
    const youtubeId = String(v.youtubeId ?? "");
    if (!/^[\w-]{11}$/.test(youtubeId)) throw new GitHubError(400, "YouTube id must be 11 characters");
    const d = String(v.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(d) || Number.isNaN(new Date(d + "Z").getTime())) throw new GitHubError(400, "video date must look like 2026-10-27T09:30:00");
    return { slug, title: text(v.title, 1, 300, "video title"), date: d, youtubeId, image: null };
  });
  const r = await putFile("content/videos.json", JSON.stringify(videos, null, 1), "Admin: update videos", b.sha);
  return json({ ok: true, sha: r.sha, commitUrl: r.commitUrl });
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
    if (e instanceof GitHubError) return bad(e.message, e.status === 422 ? 409 : e.status === 503 || e.status < 500 ? e.status : 502);
    console.error("admin error", e);
    return bad("server error", 500);
  }
}
