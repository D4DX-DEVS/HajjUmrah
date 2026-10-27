export type D1 = {
  prepare(q: string): { bind(...v: unknown[]): { run(): Promise<unknown>; first<T>(): Promise<T | null> } };
};
export type R2 = {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  head(key: string): Promise<unknown | null>;
};

export interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB?: D1; // contact_messages, admin_login_attempts (migrations/)
  MEDIA?: R2; // R2 bucket for uploaded images
  // secrets
  CONTACT_WEBHOOK_URL?: string;
  ADMIN_PASSWORD?: string; // admin login
  GITHUB_TOKEN?: string; // fine-grained token: Contents read/write on the repo
  // vars (wrangler.jsonc)
  GITHUB_REPO?: string; // owner/name
  GITHUB_BRANCH?: string;
  GITHUB_API?: string; // override for tests
  MEDIA_URL?: string; // public address of the R2 bucket (for previews)
}
