import { AwsClient } from "aws4fetch";

// Cloudflare R2 over its S3-compatible API (Vercel has no Cloudflare bindings).
// Needs R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
export const r2Configured = () => !!(process.env.R2_ENDPOINT && process.env.R2_BUCKET_NAME && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

const client = () => new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: "s3", region: "auto" });
const objectUrl = (key: string) => `${process.env.R2_ENDPOINT!.replace(/\/+$/, "")}/${process.env.R2_BUCKET_NAME}/${key.split("/").map(encodeURIComponent).join("/")}`;

export async function r2Exists(key: string) {
  const res = await client().fetch(objectUrl(key), { method: "HEAD" });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`R2 HEAD failed (${res.status})`);
  return true;
}

export async function r2Put(key: string, body: ArrayBuffer, contentType: string) {
  const put = () =>
    client().fetch(objectUrl(key), {
      method: "PUT",
      body,
      headers: { "content-type": contentType, "content-length": String(body.byteLength), "cache-control": "public, max-age=31536000, immutable" },
    });
  let res = await put();
  if (res.status === 411 || res.status >= 500) res = await put(); // seen once: a transient 411 from R2
  if (!res.ok) throw new Error(`R2 PUT failed (${res.status})`);
}
