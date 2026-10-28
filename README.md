# Hajj and Umrah (hajj.islamonlive.in)

Next.js 16 copy of the WordPress site, hosted on **Vercel**. Pages are prerendered at build time from `content/*.json` (posts are one file each in `content/posts/<id>.json`); only `/api/*` runs as Vercel Functions. Data services stay on Cloudflare: **D1** (database) and **R2** (images), reached over their HTTP APIs.

## Run

```bash
npm run dev     # dev server
npm run build   # production build
npm start       # serve the build
```

## Deploy (Vercel)

1. vercel.com → Add New → Project → import `D4DX-DEVS/HajjUmrah` (allow Vercel to read the GitHub organization). Next.js is detected; keep the default build settings.
2. Project → Settings → Environment Variables: add the variables below (Production and Preview). You can paste the contents of your local `.env`.
3. Deploy. From then on every push to `main` deploys automatically, including the commits the admin makes.
4. Domain: Settings → Domains → add `hajj.islamonlive.in`, then create the DNS record Vercel shows (a `CNAME` to `cname.vercel-dns.com`). DNS can stay where it is; it does not need to move to Cloudflare.

Without the GitHub connection (step 1 needs a GitHub "Login Connection" on the Vercel account), deploy from this folder with `npx vercel@latest deploy --prod`. The project is `d4-dx2/hajj-next`; its production address is https://hajj-next.vercel.app.

Notes: images are served as the original files (`images.unoptimized`, so no Vercel image quota is used). Vercel's free Hobby plan is for non-commercial use; check their terms for your case. Function request bodies are limited to 4.5 MB, hence the 4 MB image upload limit in the admin.

## Environment variables

| Variable | Used for |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` | D1 over its REST API (contact messages, admin login lockout). Use a token with only **D1: Edit**. |
| `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | R2 over its S3 API (admin image upload; also `scripts/upload-r2.mjs`). `R2_ACCOUNT_ID` is not needed. |
| `ADMIN_PASSWORD` | Admin login (16+ characters). Changing it logs everyone out. |
| `GITHUB_TOKEN`, `GITHUB_REPO` (`D4DX-DEVS/HajjUmrah`), `GITHUB_BRANCH` (`main`) | The admin saves posts as commits. Token: fine-grained, only this repo, **Contents: Read and write**. |
| `NEXT_PUBLIC_MEDIA_URL` | **Build time.** Public address of the R2 bucket, no trailing slash. When set, post images load from `<url>/uploads/...`. |
| `MEDIA_URL` | Optional. Address used for image previews in the admin (defaults to `NEXT_PUBLIC_MEDIA_URL`). |
| `CONTACT_WEBHOOK_URL` | Optional. The contact form also POSTs `{name, email, message}` JSON here (Formspree, Zapier...). |

The local `.env` is git-ignored. `GITHUB_API` exists only for tests.

## Admin (`/admin`)

A password-protected page to add, edit and delete posts and manage the Videos list, with image upload. Saving a post **commits a JSON file to GitHub** (`content/posts/<id>.json`); the Vercel Git deploy then rebuilds the site, so a change is live a couple of minutes later. The footer has an "Admin" link.

How it works: the page is static; `/api/admin/*` (`lib/server/admin.ts`) checks a signed login cookie, validates and sanitizes the post, and writes to GitHub with the token. Images go to R2. 5 wrong passwords from one address lock it out for 15 minutes (counted in D1).

Setup: create the GitHub token and set `ADMIN_PASSWORD` / `GITHUB_TOKEN` in Vercel, run `npm run db:migrate` once (adds the `admin_login_attempts` table), then open `https://<your-site>/admin`.

Notes:
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

Each contact-form message is saved in the `contact_messages` table of the D1 database `hajjumra`, and also forwarded to `CONTACT_WEBHOOK_URL` if set. If neither is available the form returns 503. `wrangler.jsonc` is only used by these two commands:

```bash
npm run db:migrate   # create/upgrade tables (migrations/); needs CLOUDFLARE_API_TOKEN in the shell or .env
npm run messages     # print the 50 latest messages
```

## Images on R2

The 504 files in `public/uploads` are also in the R2 bucket `hajjumra` under `uploads/...`. To serve them from R2: make the bucket public (a custom domain, or r2.dev for testing), set `NEXT_PUBLIC_MEDIA_URL`, redeploy. Keep `logo-hajj.png` and the two `cropped-icon-*.png` files in `public/uploads` (the logo and favicons always come from the site). After adding images by hand: `npm i --no-save @aws-sdk/client-s3 && node scripts/upload-r2.mjs`.

## Content

`scripts/export.mjs` and `scripts/sync-extras.mjs` are the one-off WordPress import and are no longer used (do not re-run them). The JSON in `content/` is the source of truth.

## Routes

`/`, `/[category]`, `/[category]/page/[n]`, `/[category]/[slug]`, `/tag/[slug]`, `/author/[slug]`, `/video/[slug]`, `/videos`, `/search`, `/about`, `/contact`, `/privacy-policy`, `/admin`, `/sitemap.xml`, `/robots.txt`, `/api/contact`, `/api/admin/*`.
Old WordPress category URLs (`/category/<cat>`) and the video-plugin utility pages 308-redirect to the new ones (see `next.config.ts`). Post, tag and author URLs are unchanged from WordPress.
