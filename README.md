# Hajj and Umrah (hajj.islamonlive.in)

Static Next.js 16 clone of the WordPress site. Content lives in `content/*.json`, images in `public/uploads`.

## Run

```bash
npm run dev     # dev server
npm run build   # production build
npm start       # serve the build
```

## Content

`node scripts/export.mjs` re-exports posts, categories, pages, videos and images from the WordPress REST API. It overwrites `content/` and `public/uploads`. The JSON is otherwise the source of truth.

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
Old WordPress category URLs (`/category/<cat>`) and the video-plugin utility pages 308-redirect to the new ones (see `next.config.ts`). Post, tag and author URLs are unchanged from WordPress.

## Deploy (Cloudflare Workers via OpenNext)

The site runs on Cloudflare Workers through `@opennextjs/cloudflare`. Config lives in `wrangler.jsonc` and `open-next.config.ts`; `public/_headers` caches `/_next/static/*`.

```bash
npm run preview   # build for Workers and run it locally (workerd)
npm run deploy    # build and deploy with wrangler (needs `wrangler login` or CLOUDFLARE_API_TOKEN)
```

Git integration (Workers Builds): connect the repo and set build command `npx opennextjs-cloudflare build` and deploy command `npx wrangler deploy`. Use Node 20.9 or newer.

- Set `CONTACT_WEBHOOK_URL` as a secret in the Worker's Settings → Variables and Secrets (the local `.env` is not uploaded).
- The Free plan allows 10 ms CPU per request, which Next.js rendering usually exceeds; use the Workers Paid plan.
- `next/image` uses the Cloudflare Images binding (`IMAGES`); transformations beyond the free allowance are billed.
- Add the domain under the Worker's Settings → Domains & Routes (the zone must be on Cloudflare DNS).
