import type { Env } from "./env";

// Minimal GitHub contents API client: the admin edits files in the repo, and the Git deploy rebuilds the site.
export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();

export const toB64 = (text: string) => {
  let bin = "";
  for (const b of enc.encode(text)) bin += String.fromCharCode(b);
  return btoa(bin);
};
const fromB64 = (b64: string) => dec.decode(Uint8Array.from(atob(b64.replace(/\s/g, "")), (c) => c.charCodeAt(0)));

async function gh(env: Env, method: string, path: string, body?: unknown) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new GitHubError(503, "GitHub is not configured (GITHUB_TOKEN / GITHUB_REPO)");
  const res = await fetch(`${env.GITHUB_API ?? "https://api.github.com"}/repos/${env.GITHUB_REPO}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "hajj-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

const branch = (env: Env) => env.GITHUB_BRANCH ?? "main";
const enc2 = (p: string) => p.split("/").map(encodeURIComponent).join("/");

async function fail(res: Response): Promise<never> {
  const t = await res.text().catch(() => "");
  console.error("github error", res.status, t.slice(0, 300));
  throw new GitHubError(res.status, res.status === 409 || res.status === 422 ? "conflict: the file changed, reload and retry" : `GitHub error ${res.status}`);
}

export async function getFile(env: Env, path: string): Promise<{ sha: string; text: string } | null> {
  const res = await gh(env, "GET", `/contents/${enc2(path)}?ref=${encodeURIComponent(branch(env))}`);
  if (res.status === 404) return null;
  if (!res.ok) return fail(res);
  const j = (await res.json()) as { sha: string; content: string };
  return { sha: j.sha, text: fromB64(j.content) };
}

export async function putFile(env: Env, path: string, text: string, message: string, sha?: string) {
  const res = await gh(env, "PUT", `/contents/${enc2(path)}`, { message, content: toB64(text), branch: branch(env), ...(sha ? { sha } : {}) });
  if (!res.ok) return fail(res);
  const j = (await res.json()) as { content: { sha: string }; commit: { html_url: string } };
  return { sha: j.content.sha, commitUrl: j.commit.html_url };
}

export async function deleteFile(env: Env, path: string, sha: string, message: string) {
  const res = await gh(env, "DELETE", `/contents/${enc2(path)}`, { message, sha, branch: branch(env) });
  if (!res.ok) return fail(res);
  return { commitUrl: ((await res.json()) as { commit: { html_url: string } }).commit.html_url };
}

// File names in a directory (git trees API, no 1000-file cap like the contents API).
export async function listNames(env: Env, dir: string): Promise<string[]> {
  const res = await gh(env, "GET", `/git/trees/${encodeURIComponent(branch(env))}:${enc2(dir)}`);
  if (res.status === 404) return [];
  if (!res.ok) return fail(res);
  return ((await res.json()) as { tree: { path: string }[] }).tree.map((t) => t.path);
}
