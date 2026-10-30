// Cloudflare bindings (wrangler.jsonc), read from the request context OpenNext sets up (also in `next dev`).
import { getCloudflareContext } from "@opennextjs/cloudflare";

type Stmt = {
  run(): Promise<{ meta: { changes: number } }>;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
};
type D1 = { prepare(q: string): { bind(...v: unknown[]): Stmt } };
type R2 = {
  put(key: string, value: ArrayBuffer | string, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  head(key: string): Promise<unknown | null>;
};

const env = () => getCloudflareContext().env as unknown as { DB?: D1; MEDIA?: R2 };
export const bindings = {
  get DB() { return env().DB; },
  get MEDIA() { return env().MEDIA; },
};
