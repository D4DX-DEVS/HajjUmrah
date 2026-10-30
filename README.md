# Hajj and Umrah (hajj.islamonlive.in)

Next.js 16 copy of the WordPress site, running on **Cloudflare Workers** (OpenNext). Posts, tags and videos live in **D1**; every page is rendered by the Worker on request and kept in a page cache (below). Images uploaded in the admin live in **R2**. The admin writes straight to D1, so a change is live at once, with no rebuild and no GitHub token.

## Run

```bash
npm run db:seed:local   # once: fill the local D1 copy from content/*.json (after `npx wrangler d1 migrations apply hajjumra --local`)
npm run dev             # dev server on the local D1/R2 copy, never the live data
npm run preview         # build with OpenNext and run it like production
npm run deploy          # build, deploy, then clear the page cache
```

`.dev.vars` (git-ignored) holds `ADMIN_PASSWORD=...` for local work.

## Deploy (Cloudflare)

Worker `hajj-next` (`wrangler.jsonc`, entry `worker.ts`). **Always deploy with `npm run deploy`**: the build copies `.env` into the Worker, and `scripts/strip-env.mjs` removes everything except `SITE_URL` and `NEXT_PUBLIC_MEDIA_URL` before it ships. The deploy token in `.env` needs permission to edit Workers, D1 and R2.

1. First time only: `npm run db:migrate` (tables), then `npm run db:seed:remote` (loads `content/*.json` into D1; it refuses to run when posts already exist).
2. `npm run deploy`.
3. Secret: `npx wrangler secret put ADMIN_PASSWORD` (16+ characters; changing it logs everyone out). Optional: `CONTACT_WEBHOOK_URL`.
4. Domain: Worker → Settings → Domains & Routes → `hajj.islamonlive.in`.

| Setting | Where |
|---|---|
| `ADMIN_PASSWORD`, `CONTACT_WEBHOOK_URL` | Worker secrets |
| `SITE_URL`, `MEDIA_URL` | `wrangler.jsonc` vars |
| `NEXT_PUBLIC_MEDIA_URL` | **Build time**, in `.env`. Public address of the R2 bucket, no trailing slash; when set, post images load from `<url>/uploads/...` |

## Page cache (stays inside the free plan)

D1's free tier allows 5M row reads a day, and an uncached page reads a few hundred rows, so `worker.ts` (the Worker's entry point, wrapping the OpenNext app) stores every public page: in each Cloudflare location's own cache, and once for the whole world in the R2 bucket (`cache/pages/...`).

- A stored page stays valid until the next change in the admin (every save, create or delete writes `cache/purged`; the editing location sees it at once, the others within 30 seconds) or 7 days. A Cron Trigger (every 5 minutes) also renders up to 5 pages per run that are not stored yet, so nearly every page is stored before anyone visits it.
- Never stored: `/admin`, `/api/*`, form posts, search, anything with a cookie. If D1 fails while a page renders, the old stored copy is served.
- The free plan cuts a request off at 10 ms of CPU and a fresh render can exceed it, so a render runs in a separate internal call (the Worker calling itself through `WORKER_SELF_REFERENCE`, marked with a key derived from `ADMIN_PASSWORD`) that is retried up to 3 times. Do not crawl the whole site quickly; Workers Paid ($5/month) removes the cut-off.
- `npm run deploy` clears the cache at the end (stored pages name the CSS and font files of the build that rendered them).
- Clear it by hand: `npx wrangler r2 object put hajjumra/cache/purged --remote --pipe < <(date +%s%3N)` (any newer timestamp works).
- Any address other than `SITE_URL` that reaches the Worker (workers.dev, a staging name) answers `robots.txt` with "disallow all" and marks pages `noindex`. A forwarding Worker in front of the domain must send `x-forwarded-host` with the public host.

## Admin (`/admin`)

A password-protected page to add, edit and delete posts and manage the Videos list, with image upload. Saving writes to D1 and purges the page cache, so the change is live straight away. The admin loads its post list from `/admin/index.json`.

How it works: `/api/admin/*` (`lib/server/admin.ts`) checks a signed login cookie, validates and sanitizes the post and writes to D1 (the editor sends back the row's revision, and a stale one is refused as a conflict). Images go to R2. 5 wrong passwords from one address lock it out for 15 minutes (counted in D1; behind a forwarder that address is the forwarder's unless it passes the visitor's on).

Notes:
- New posts are written as plain text (blank line = new paragraph); "Edit as HTML" switches to raw HTML, and imported posts open in HTML mode.
- Saving an existing post keeps its URL if you leave the slug alone, keeps extra categories (the "Also show in" boxes) and the original time of day.
- Post bodies are cleaned on save: scripts, event handlers, `javascript:`/`data:` links and any iframe except YouTube/Spotify are removed. This is a safety net, not a full HTML sanitizer, so keep the password private.
- There is no history: a deleted post is gone. Back up with `npx wrangler d1 export hajjumra --remote --output backup.sql`.

## Content

`content/*.json` is only the seed for `scripts/seed-d1.mjs` (the original WordPress export). **D1 is the source of truth**: edits in the admin never reach those files, and `scripts/add-post.mjs` (which wrote them) is no longer used. `scripts/export.mjs` and `scripts/sync-extras.mjs` were the one-off WordPress import; do not re-run them.

## Contact messages (D1)

Each contact-form message is saved in the `contact_messages` table and also forwarded to `CONTACT_WEBHOOK_URL` if set. If neither is available the form returns 503.

```bash
npm run db:migrate   # create/upgrade tables (migrations/)
npm run messages     # print the 50 latest messages
```

## Images on R2

The 504 files in `public/uploads` are also in the R2 bucket `hajjumra` under `uploads/...`. To serve them from R2: make the bucket public (a custom domain, or r2.dev for testing), set `NEXT_PUBLIC_MEDIA_URL`, redeploy. Keep `logo-hajj.png` and the two `cropped-icon-*.png` files in `public/uploads` (the logo and favicons always come from the site). After adding images by hand: `npm i --no-save @aws-sdk/client-s3 && node scripts/upload-r2.mjs`.

## Routes

`/`, `/[category]`, `/[category]/page/[n]`, `/[category]/[slug]`, `/tag/[slug]`, `/author/[slug]`, `/video/[slug]`, `/videos`, `/search`, `/about`, `/contact`, `/privacy-policy`, `/admin`, `/sitemap.xml`, `/robots.txt`, `/api/contact`, `/api/admin/*`.
Old WordPress category URLs (`/category/<cat>`) and the video-plugin utility pages 308-redirect to the new ones (see `next.config.ts`). Post, tag and author URLs are unchanged from WordPress.
