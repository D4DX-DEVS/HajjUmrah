// Defence in depth for post bodies written through the admin. Regex based, so it is not a full HTML
// sanitizer: it removes scripts, event handlers, javascript:/data: URLs and every iframe except YouTube and Spotify embeds.
// Only trusted editors can publish, so this limits the damage if the admin password ever leaks.
const BLOCK = "script|style|object|embed|link|meta|base|form|svg|math|template|noscript";
// iframes are removed unless they embed YouTube or Spotify (the only embeds the site uses)
const EMBED_SRC = /\bsrc\s*=\s*["']https:\/\/(www\.youtube(-nocookie)?\.com\/embed\/[\w-]{11}|podcasters\.spotify\.com\/pod\/show\/[\w/.%~-]+|open\.spotify\.com\/embed\/[\w/.%~-]+)(\?[^"'\s<>]*)?["']/i;

export function sanitizeHtml(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, "");
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(new RegExp(`<\\s*(${BLOCK})\\b[\\s\\S]*?<\\s*/\\s*\\1\\s*>`, "gi"), "")
      .replace(new RegExp(`<\\s*/?\\s*(${BLOCK})\\b[^>]*>`, "gi"), "")
      .replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, (m) => (EMBED_SRC.test(m) ? m : ""))
      .replace(/<\s*\/?\s*iframe\b[^>]*>/gi, (m) => (/^<\s*\//.test(m) || EMBED_SRC.test(m) ? m : ""))
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s(href|src|srcset|xlink:href|action|formaction|poster)\s*=\s*(["'])?\s*(javascript|vbscript|data)\s*:[^"'>\s]*\2?/gi, "");
  }
  return s;
}
