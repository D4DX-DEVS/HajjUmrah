// Cloudflare bindings, handed over by worker/index.ts on every request.
type D1 = { prepare(q: string): { bind(...v: unknown[]): { run(): Promise<unknown>; first<T>(): Promise<T | null> } } };
type R2 = {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  head(key: string): Promise<unknown | null>;
};

export const bindings: { DB?: D1; MEDIA?: R2 } = {};
