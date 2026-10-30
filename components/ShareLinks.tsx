// Plain share links (no scripts, no tracking): each opens the network's own share page.
export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const items = [
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`, "f"],
    ["X", `https://twitter.com/intent/tweet?url=${u}&text=${t}`, "X"],
    ["WhatsApp", `https://wa.me/?text=${t}%20${u}`, "W"],
    ["Telegram", `https://t.me/share/url?url=${u}&text=${t}`, "T"],
  ];
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600">
      <span>Share</span>
      {items.map(([name, href, glyph]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold-light transition-colors hover:bg-gold hover:text-ink">
          {glyph}
        </a>
      ))}
    </div>
  );
}
