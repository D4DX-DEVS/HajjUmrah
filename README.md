# Hajj and Umrah (hajj.islamonlive.in)

Static Next.js 16 clone of the WordPress site. Content lives in `content/*.json`, images in `public/uploads`.

## Run

```bash
npm run dev     # dev server
npm run build   # static export into out/
```

## Content

`node scripts/export.mjs` re-exports posts, categories, pages, videos and images from the WordPress REST API. It overwrites `content/` and `public/uploads`. The JSON is otherwise the source of truth.

## Admin (`/admin`)

A password-protected page to add, edit and delete posts and manage the Videos list, with image upload. Saving a post **commits a JSON file to GitHub** (`content/posts/<id>.json`); the connected Git deploy then rebuilds the site, so a change is live about 2-3 minutes later. Nothing is stored in a database except failed-login counts.

How it works: the page is static; `/api/admin/*` (`worker/admin.ts`) checks a signed login cookie, validates and sanitizes the post, and writes to GitHub with a token. Images go to the R2 bucket (binding `MEDIA`). 5 wrong passwords from one address lock it out for 15 minutes.

One-time setup (the Worker must already be deployed once):

1. **GitHub token.** GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only `D4DX-DEVS/HajjUmrah`. Permission: Repository → **Contents: Read and write**. Set an expiry and note when to renew.
2. **Secrets on the Worker** (Cloudflare dashboard → the Worker → Settings → Variables and Secrets, or `npx wrangler secret put NAME`):
   - `ADMIN_PASSWORD`: a long random password (16+ characters). Changing it logs everyone out.
   - `GITHUB_TOKEN`: the token from step 1.
3. **Login table:** `npm run db:migrate` (adds `admin_login_attempts`; login refuses to work without it).
4. **Git deploys** connected in Cloudflare (Workers & Pages → the Worker → Settings → Builds) so each commit rebuilds the site.
5. Open `https://<your-site>/admin`.

Notes:
- Saving an existing post keeps its URL if you leave the slug alone, keeps extra categories (the "Also show in" boxes) and the original time of day.
- The list in the admin is the last published version of the site; a post you just saved shows up there after the rebuild.
- Post bodies are cleaned on save: scripts, event handlers, `javascript:`/`data:` links and any iframe except YouTube/Spotify are removed. This is a safety net, not a full HTML sanitizer, so keep the password private.
- Extra protection (optional): put `/admin*` and `/api/admin/*` behind Cloudflare Access (free for small teams).
- Local testing with the real token commits to the real repo. Test with a throwaway token/repo, or leave `GITHUB_TOKEN` empty.

## Adding a post from the command line

Write one text file (front matter, then the body) and run the script. It adds the post to `content/`, creates new authors and tags as needed, and copies the image into `public/uploads`.

```
---
title: Title of the post
slug: url-part              (needed when the title has no English words)
category: articles          (articles, fatwa, fiqh, hajj-umrah, history-culture, rituals)
author: Author Name
date: 2026-10-27            (optional)
tags: Hajj, Tawaf           (optional)
image: photo.jpg            (optional; a file next to this one, /uploads/... or a URL)
excerpt: Short summary      (optional)
---
Body: HTML, or plain text where a blank line starts a new paragraph.
```

```bash
node scripts/add-post.mjs my-post.txt --dry-run   # check what it would add
node scripts/add-post.mjs my-post.txt             # add it
node scripts/upload-r2.mjs                        # only if images are served from R2 (uploads just the new files)
npm run build                                     # optional local check
node scripts/add-post.mjs my-post.txt --push      # same as adding, then git add/commit/push
```

Pushing to `main` redeploys the site when Git deploys are connected in Cloudflare (Workers & Pages → the Worker → Settings → Builds), so a new post goes live a couple of minutes after the push.

## Config

| Env var | Purpose |
|---|---|
| `CONTACT_WEBHOOK_URL` | Optional. Contact form also POSTs `{name, email, message}` JSON here (Formspree, Zapier...). |
| `NEXT_PUBLIC_MEDIA_URL` | Optional, **build time**. Public address of the R2 bucket (no trailing slash). When set, post images and in-article images load from `<url>/uploads/...` instead of the site itself. Also set it as a build variable on Cloudflare. |
| `R2_*` | Only used by `scripts/upload-r2.mjs` (S3 keys for the `hajjumra` bucket). |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID` | Only used by the wrangler CLI (`db:migrate`, `messages`). The Worker itself uses the `DB` binding in `wrangler.jsonc`. |

The local `.env` is git-ignored and never uploaded. Secrets are only needed on your machine and, for `CONTACT_WEBHOOK_URL`, as a Worker secret.

## Contact messages (Cloudflare D1)

Each contact-form message is saved in the `contact_messages` table of the D1 database `hajjumra` (binding `DB`), and also forwarded to `CONTACT_WEBHOOK_URL` if set. If neither is available the form returns 503.

```bash
npm run db:migrate   # create/upgrade the table (migrations/), already applied once
npm run messages     # print the 50 latest messages
```

## Images on R2

The 504 files in `public/uploads` are also in the R2 bucket `hajjumra` under `uploads/...`. To serve them from R2: make the bucket public (custom domain such as `media.islamonlive.in`, or r2.dev), set `NEXT_PUBLIC_MEDIA_URL`, rebuild. Keep `logo-hajj.png` and the two `cropped-icon-*.png` files in `public/uploads` (the logo and favicons are always served from the site). After adding images: `npm i --no-save @aws-sdk/client-s3 && node scripts/upload-r2.mjs`.

## Routes

`/`, `/[category]`, `/[category]/page/[n]`, `/[category]/[slug]`, `/author/[slug]`, `/videos`, `/search`, `/about`, `/contact`, `/privacy-policy`, `/sitemap.xml`, `/robots.txt`.
Old WordPress category URLs (`/category/<cat>`) and the video-plugin utility pages 308-redirect to the new ones (see `public/_redirects`). Post, tag and author URLs are unchanged from WordPress.

## Deploy (Cloudflare, free plan)

The site is a static export (`output: "export"` in `next.config.ts`): `next build` writes plain HTML to `out/`, and Cloudflare serves it as static assets, which are free and have no CPU limit. Only `/api/*` runs Worker code (`worker/index.ts`, the contact form), so the Workers Free plan is enough.

- `public/_redirects`: old WordPress URLs (`/category/<cat>`, video-plugin pages) to the new ones.
- `public/_headers`: security headers and long caching for `/_next/static/*`.
- `wrangler.jsonc`: assets from `./out`, real 404 via `out/404.html`, D1 binding `DB`.

```bash
npm run preview   # next build + wrangler dev (local Workers runtime, local D1)
npm run deploy    # next build + wrangler deploy (needs `wrangler login` or CLOUDFLARE_API_TOKEN)
```

Git integration (Workers Builds): connect the repo, build command `npm run build`, deploy command `npx wrangler deploy`. Use Node 20.9 or newer, and add `NEXT_PUBLIC_MEDIA_URL` as a build variable if you use R2 images.

- `CONTACT_WEBHOOK_URL` is optional: add it as a secret in the Worker's Settings → Variables and Secrets (the local `.env` is not uploaded). Messages are saved to D1 either way.
- Images are served as the original files (no optimizer in a static export).
- Add the domain under the Worker's Settings → Domains & Routes (the zone must be on Cloudflare DNS).
- New posts need a rebuild and redeploy; there is no server rendering.
