# Hajj and Umrah (hajj.islamonlive.in)

Next.js 16 copy of the WordPress site, hosted on **Cloudflare**. `next build` exports plain HTML into `out/`, served as free static assets; only `/api/*` runs as a Worker (`worker/index.ts`). Content lives in `content/*.json` (posts are one file each in `content/posts/<id>.json`). Data: **D1** (database) and **R2** (images), both bound to the Worker.

## Run

```bash
npm run dev       # dev server (pages only; /api/* needs the Worker)
npm run build     # static export into out/
npm run preview   # build, then run the site and APIs locally with wrangler (local D1/R2)
npm run deploy    # build, then deploy the Worker + assets
```

## Deploy (Cloudflare)

Worker `hajj-next` (`wrangler.jsonc`). Redirects and headers live in `public/_redirects` and `public/_headers`.

1. `npx wrangler login`, then `npm run deploy`. Bindings `DB` (D1 `hajjumra`) and `MEDIA` (R2 `hajjumra`) and the vars come from `wrangler.jsonc`.
2. Secrets (`npx wrangler secret put NAME`, or dashboard → Worker → Settings → Variables and Secrets): `ADMIN_PASSWORD`, `GITHUB_TOKEN`, optional `CONTACT_WEBHOOK_URL`.
3. Git deploys: dashboard → Workers & Pages → `hajj-next` → Settings → Builds → connect `D4DX-DEVS/HajjUmrah` (build `npm run build`, deploy `npx wrangler deploy`, build variable `NEXT_PUBLIC_MEDIA_URL` if used). After that every push to `main` deploys, including the commits the admin makes.
4. Domain: Worker → Settings → Domains & Routes → add `hajj.islamonlive.in` (the zone must be on Cloudflare).

## Environment variables

| Variable | Used for |
|---|---|
| `ADMIN_PASSWORD` (secret) | Admin login (16+ characters). Changing it logs everyone out. |
| `GITHUB_TOKEN` (secret), `GITHUB_REPO`, `GITHUB_BRANCH` | The admin saves posts as commits. Token: fine-grained, only this repo, **Contents: Read and write**. Repo and branch are in `wrangler.jsonc`. |
| `MEDIA_URL` | Public address of the R2 bucket, for image previews in the admin (`wrangler.jsonc`). |
| `NEXT_PUBLIC_MEDIA_URL` | **Build time.** Same address, no trailing slash. When set, post images load from `<url>/uploads/...`. |
| `CONTACT_WEBHOOK_URL` (secret) | Optional. The contact form also POSTs `{name, email, message}` JSON here (Formspree, Zapier...). |

The local `.env` is git-ignored. `GITHUB_API` exists only for tests.

## Admin (`/admin`)

A password-protected page to add, edit and delete posts and manage the Videos list, with image upload. Saving a post **commits a JSON file to GitHub** (`content/posts/<id>.json`); the connected Git deploy then rebuilds the site, so a change is live a couple of minutes later. The footer has an "Admin" link.

How it works: the page is static; `/api/admin/*` (`lib/server/admin.ts`, run by the Worker) checks a signed login cookie, validates and sanitizes the post, and writes to GitHub with the token. Images go to R2. 5 wrong passwords from one address lock it out for 15 minutes (counted in D1).

Setup: create the GitHub token and set the `ADMIN_PASSWORD` / `GITHUB_TOKEN` secrets, run `npm run db:migrate` once (adds the `admin_login_attempts` table), then open `https://<your-site>/admin`.

Notes:
- The admin hides the public header and footer. The editor has a Posts back link (the browser Back button works too), a Ctrl+S shortcut and an "Unsaved changes" warning.
- New posts are written as plain text (blank line = new paragraph); "Edit as HTML" switches to raw HTML, and imported posts open in HTML mode.
- Saving an existing post keeps its URL if you leave the slug alone, keeps extra categories (the "Also show in" boxes) and the original time of day.
- The admin's list is the last published version of the site; a post you just saved appears after the rebuild.
- Post bodies are cleaned on save: scripts, event handlers, `javascript:`/`data:` links and any iframe except YouTube/Spotify are removed. This is a safety net, not a full HTML sanitizer, so keep the password private.
- The admin loads the post list from the site's own `/admin/index.json`, so it needs a production deployment (protected preview deployments block that request).
- Testing locally with the real token commits to the real repo. Leave `GITHUB_TOKEN` empty, or use a throwaway repo.

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

Pushing to `main` deploys the site, so a new post goes live a couple of minutes after the push.

## Contact messages (Cloudflare D1)

Each contact-form message is saved in the `contact_messages` table of the D1 database `hajjumra`, and also forwarded to `CONTACT_WEBHOOK_URL` if set. If neither is available the form returns 503. Wrangler commands:

```bash
npm run db:migrate   # create/upgrade tables (migrations/); after `npx wrangler login`
npm run messages     # print the 50 latest messages
```

## Images on R2

The 504 files in `public/uploads` are also in the R2 bucket `hajjumra` under `uploads/...`. To serve them from R2: make the bucket public (a custom domain, or r2.dev for testing), set `NEXT_PUBLIC_MEDIA_URL`, redeploy. Keep `logo-hajj.png` and the two `cropped-icon-*.png` files in `public/uploads` (the logo and favicons always come from the site). After adding images by hand: `npm i --no-save @aws-sdk/client-s3 && node scripts/upload-r2.mjs`.

## Content

`scripts/export.mjs` and `scripts/sync-extras.mjs` are the one-off WordPress import and are no longer used (do not re-run them). The JSON in `content/` is the source of truth.

## Routes

`/`, `/[category]`, `/[category]/page/[n]`, `/[category]/[slug]`, `/tag/[slug]`, `/author/[slug]`, `/video/[slug]`, `/videos`, `/search`, `/about`, `/contact`, `/privacy-policy`, `/admin`, `/sitemap.xml`, `/robots.txt`, `/api/contact`, `/api/admin/*`.
Old WordPress category URLs (`/category/<cat>`) and the video-plugin utility pages 308-redirect to the new ones (see `public/_redirects`). Post, tag and author URLs are unchanged from WordPress.
