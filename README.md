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
Old WordPress URLs (`/<slug>`, `/category/<cat>`) 308-redirect to the new ones (see `next.config.ts`).
