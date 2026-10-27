// Upload public/uploads/** to R2 as uploads/** (same paths the site already uses).
// Usage: npm i --no-save @aws-sdk/client-s3 && node scripts/upload-r2.mjs   (reads R2_* from .env)
import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
const [, , envFile = ".env", dir = "public/uploads"] = process.argv;
const env = Object.fromEntries(fs.readFileSync(envFile, "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const s3 = new S3Client({ region: "auto", endpoint: env.R2_ENDPOINT, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY } });
const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".avif": "image/avif", ".ico": "image/x-icon" };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const listKeys = async () => {
  const keys = new Map();
  let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME, Prefix: "uploads/", ContinuationToken: token }));
    for (const o of r.Contents ?? []) keys.set(o.Key, o.Size);
    token = r.NextContinuationToken;
  } while (token);
  return keys;
};
const keyOf = (f) => "uploads/" + path.relative(dir, f).split(path.sep).join("/");
const existing = await listKeys(); // only upload what is missing or changed
const files = walk(dir).filter((f) => existing.get(keyOf(f)) !== fs.statSync(f).size);
let done = 0, bytes = 0; const failed = [];
const q = [...files];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (q.length) {
    const f = q.shift();
    const key = keyOf(f);
    try {
      const body = fs.readFileSync(f);
      await s3.send(new PutObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: types[path.extname(f).toLowerCase()] ?? "application/octet-stream", CacheControl: "public, max-age=31536000, immutable" }));
      done++; bytes += body.length;
    } catch (e) { failed.push(key + " " + e.name); }
  }
}));
// verify by listing
const after = await listKeys();
const n = after.size, size = [...after.values()].reduce((a, b) => a + b, 0);
console.log(JSON.stringify({ toUpload: files.length, uploaded: done, failed: failed.length, bucketObjects: n, uploadedMB: +(bytes / 1e6).toFixed(1), bucketMB: +(size / 1e6).toFixed(1) }));
failed.slice(0, 5).forEach((f) => console.log("FAIL", f));
