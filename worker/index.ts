// Cloudflare Worker entry. Static assets are served directly (see wrangler.jsonc run_worker_first);
// only /api/* reaches this code. Keep it light: the free plan allows 10 ms CPU per request.
import { handleAdmin } from "../lib/server/admin";
import { bindings } from "../lib/server/bindings";
import { handleContact } from "../lib/server/contact";

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB?: typeof bindings.DB;
  MEDIA?: typeof bindings.MEDIA;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    bindings.DB = env.DB;
    bindings.MEDIA = env.MEDIA;
    const { pathname } = new URL(req.url);
    if (pathname === "/api/contact") return req.method === "POST" ? handleContact(req) : new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
    if (pathname.startsWith("/api/admin/")) return handleAdmin(req);
    if (pathname.startsWith("/api/")) return new Response("Not Found", { status: 404 });
    return env.ASSETS.fetch(req);
  },
};
