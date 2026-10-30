import { bindings } from "./bindings";

// R2 bucket for images uploaded in the admin
export const r2Configured = () => !!bindings.MEDIA;

export const r2Exists = async (key: string) => (await bindings.MEDIA!.head(key)) !== null;

export const r2Put = (key: string, body: ArrayBuffer, contentType: string) =>
  bindings.MEDIA!.put(key, body, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
