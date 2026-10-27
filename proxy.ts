import { NextResponse, type NextRequest } from "next/server";
import sitemap from "./app/sitemap";

// Streamed pages fix their status at 200 before notFound() runs, so unknown URLs are rejected
// here with a real 404. Known paths = everything the sitemap lists (plus /search).
const norm = (p: string) => decodeURIComponent(p).replace(/\/+$/, "") || "/";
const known = new Set(sitemap().map((e) => norm(new URL(e.url).pathname)));
known.add("/search");

// Paths that next.config redirects handle. Some hosts (Netlify) run redirects after the proxy,
// so let them through here instead of 404ing them.
const redirected = /^\/(category\/[^/]+(\/page\/\d+)?|video|player-embed|user-videos|search-videos|video-tag|video-category|4177-2)$/;

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Hajj and Umrah</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fafaf9;color:#171717;text-align:center"><div><h1 style="font-size:4rem;margin:0;color:#047857">404</h1><p>This page could not be found.</p><a href="/" style="color:#047857">Back to home</a></div></body></html>`;

export function proxy(req: NextRequest) {
  let path: string | null = null;
  try {
    path = norm(req.nextUrl.pathname);
  } catch {} // malformed %-encoding
  if (path && (known.has(path) || redirected.test(path))) return NextResponse.next();
  return new NextResponse(page, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

export const config = { matcher: ["/((?!api|_next|uploads|favicon.ico|robots.txt|sitemap.xml).*)"] };
