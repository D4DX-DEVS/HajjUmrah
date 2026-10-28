// Browser side of the admin: calls /api/admin/* (cookie session; the header is a CSRF guard).
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, { ...init, credentials: "same-origin", headers: { "x-admin-request": "1", ...init.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export type Index = {
  categories: { slug: string; name: string }[];
  authors: { id: number; name: string; slug: string }[];
  tags: { slug: string; name: string }[];
  posts: { id: number; slug: string; title: string; category: string; date: string }[];
};

export const decodeEntities = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// plain text (blank line = new paragraph, single line break = <br>) to HTML; every character is escaped
export const plainToHtml = (t: string) =>
  t.trim() ? t.trim().split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("\n") : "";

// public address of the R2 bucket, for showing images that were uploaded there
export const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
export const imageSrc = (path: string) => (path.startsWith("/uploads/") && MEDIA ? `${MEDIA}${path}` : path);

export const safeDecode = (s: string) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
export const youtubeId = (s: string) => /(?:v=|youtu\.be\/|embed\/|^)([\w-]{11})(?:[&?/]|$)/.exec(s.trim())?.[1] ?? "";
