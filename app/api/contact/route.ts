import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1 = { prepare(q: string): { bind(...v: unknown[]): { run(): Promise<unknown> } } };

// Each sink returns true (done), false (failed) or null (not configured).
async function saveToD1(m: { name: string; email: string; message: string }) {
  let db: D1 | undefined;
  try {
    db = (getCloudflareContext().env as { DB?: D1 }).DB; // only exists on Cloudflare (or `wrangler dev`)
  } catch {}
  if (!db) return null;
  try {
    await db.prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)").bind(m.name, m.email, m.message).run();
    return true;
  } catch (e) {
    console.error("contact: D1 insert failed", e);
    return false;
  }
}

// Optional: also forward as JSON to CONTACT_WEBHOOK_URL (e.g. Formspree, Zapier).
async function forward(m: { name: string; email: string; message: string }) {
  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (!hook) return null;
  try {
    return (await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(m) })).ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  if (b?.website) return Response.json({ ok: true }); // honeypot
  const m = { name: str(b?.name, 100), email: str(b?.email, 200), message: str(b?.message, 5000) };
  if (!m.name || !m.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) return Response.json({ error: "invalid" }, { status: 400 });
  const results = (await Promise.all([saveToD1(m), forward(m)])).filter((r) => r !== null);
  if (!results.length) return Response.json({ error: "not configured" }, { status: 503 });
  // one working sink is enough: the message is not lost
  return results.includes(true) ? Response.json({ ok: true }) : Response.json({ error: "upstream" }, { status: 502 });
}
