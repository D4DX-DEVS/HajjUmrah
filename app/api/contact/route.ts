// Forwards the message as JSON to CONTACT_WEBHOOK_URL (e.g. Formspree, Slack, Zapier).
export async function POST(req: Request) {
  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (!hook) return Response.json({ error: "not configured" }, { status: 503 });
  const b = await req.json().catch(() => null);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  if (b?.website) return Response.json({ ok: true }); // honeypot
  const name = str(b?.name, 100), email = str(b?.email, 200), message = str(b?.message, 5000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "invalid" }, { status: 400 });
  const r = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, message }) });
  return r.ok ? Response.json({ ok: true }) : Response.json({ error: "upstream" }, { status: 502 });
}
