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
| `CONTACT_WEBHOOK_URL` | Contact form POSTs `{name, email, message}` JSON here (Formspree, Slack, Zapier...). Unset: the form returns 503. |

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
