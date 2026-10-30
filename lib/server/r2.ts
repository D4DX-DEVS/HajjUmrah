import { bindings } from "./bindings";

// R2 bucket: images uploaded in the admin (uploads/) and the stored copies of rendered pages (cache/, see worker.ts)
export const r2Configured = () => !!bindings.MEDIA;

export const r2Exists = async (key: string) => (await bindings.MEDIA!.head(key)) !== null;

export const r2Put = (key: string, body: ArrayBuffer, contentType: string) =>
  bindings.MEDIA!.put(key, body, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });

// Every admin change calls this: stored pages older than this moment are rendered again (worker.ts).
// The marker is also dropped from this location's edge cache, so the editor sees the change at once (other locations within 30 s).
export async function purgePages() {
  await bindings.MEDIA?.put("cache/purged", String(Date.now()), { httpMetadata: { contentType: "text/plain" } });
  await (caches as unknown as { default: Cache }).default.delete(new Request("https://cache.internal/purged"));
}
