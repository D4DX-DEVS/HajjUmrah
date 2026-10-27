// Cloudflare Worker entry. Static assets are served directly (see wrangler.jsonc run_worker_first);
// only /api/* reaches this code. Keep it tiny: the free plan allows 10 ms CPU per request.
type D1 = { prepare(q: string): { bind(...v: unknown[]): { run(): Promise<unknown> } } };
interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB?: D1; // contact_messages table (migrations/)
  CONTACT_WEBHOOK_URL?: string; // optional secret: also forward as JSON (Formspree, Zapier...)
}
type Message = { name: string; email: string; message: string };

const json = (body: unknown, status = 200) => Response.json(body, { status });

// Each sink returns true (done), false (failed) or null (not configured).
async function saveToD1(env: Env, m: Message) {
  if (!env.DB) return null;
  try {
    await env.DB.prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)").bind(m.name, m.email, m.message).run();
    return true;
  } catch (e) {
    console.error("contact: D1 insert failed", e);
    return false;
  }
}

async function forward(env: Env, m: Message) {
  if (!env.CONTACT_WEBHOOK_URL) return null;
  try {
    return (await fetch(env.CONTACT_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(m) })).ok;
  } catch {
    return false;
  }
}

async function contact(req: Request, env: Env) {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
  const b = await req.json().catch(() => null);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  if (b?.website) return json({ ok: true }); // honeypot
  const m = { name: str(b?.name, 100), email: str(b?.email, 200), message: str(b?.message, 5000) };
  if (!m.name || !m.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) return json({ error: "invalid" }, 400);
  const results = (await Promise.all([saveToD1(env, m), forward(env, m)])).filter((r) => r !== null);
  if (!results.length) return json({ error: "not configured" }, 503);
  // one working sink is enough: the message is not lost
  return results.includes(true) ? json({ ok: true }) : json({ error: "upstream" }, 502);
}

const worker = {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/contact") return contact(req, env);
    if (pathname.startsWith("/api/")) return new Response("Not Found", { status: 404 });
    return env.ASSETS.fetch(req);
  },
};

export default worker;
