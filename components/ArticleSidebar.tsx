import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import YtThumb from "@/components/YtThumb";
import { allPosts, allVideos, decode, fmtDate, getCategory, postHref, postsIn, type Post } from "@/lib/data";

export type Heading = { id: string; text: string };

const head = (t: string) => (
  <h2 className="mb-4 border-l-2 border-gold pl-3 font-display text-lg font-extrabold">{t}</h2>
);

function Story({ post }: { post: Post }) {
  return (
    <li className="group relative flex gap-3 py-3 first:pt-0 last:pb-0">
      <span className="relative block h-16 w-20 shrink-0 overflow-hidden bg-madinah-wash">
        {post.image ? <Image src={post.image} alt="" fill sizes="80px" className="object-cover transition duration-500 group-hover:scale-105" /> : <ImagePlaceholder />}
      </span>
      <div className="min-w-0">
        <h3 className="line-clamp-3 text-sm font-bold leading-snug"><Link href={postHref(post)} className="after:absolute after:inset-0"><span className="sweep pb-0.5">{decode(post.title)}</span></Link></h3>
        <p className="mt-1 text-xs text-neutral-600">{fmtDate(post.date)}</p>
      </div>
    </li>
  );
}

// Right-hand column of an article: the category, contents, related stories, videos and the latest posts.
export default function ArticleSidebar({ post, headings }: { post: Post; headings: Heading[] }) {
  const cat = getCategory(post.category);
  const related = postsIn(post.category).filter((p) => p.id !== post.id).slice(0, 4);
  const shown = new Set([post.id, ...related.map((p) => p.id)]);
  const latest = allPosts.filter((p) => !shown.has(p.id)).slice(0, 3);
  const catImage = related.find((p) => p.image)?.image ?? post.image;
  const videos = allVideos.filter((v) => v.youtubeId).slice(0, 3);
  const card = "border border-hairline bg-white p-5";
  return (
    <aside className="space-y-6" aria-label="Related">
      <Link href={`/${post.category}`} className="group relative flex min-h-56 flex-col justify-end overflow-hidden bg-ink p-5 text-white ring-1 ring-gold/30">
        {catImage ? <Image src={catImage} alt="" fill sizes="320px" className="object-cover opacity-70 transition duration-700 group-hover:scale-105" /> : <ImagePlaceholder dark />}
        <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <span className="relative font-display text-2xl font-black text-gold-light">{cat?.name}</span>
        <span className="relative mt-1 text-sm text-white/80">All {postsIn(post.category).length} posts <span aria-hidden>→</span></span>
      </Link>

      {headings.length > 1 && (
        <nav aria-label="In this article" className={card}>
          {head("In this article")}
          <ol className="space-y-2.5 text-sm">
            {headings.map((h, i) => (
              <li key={h.id} className="flex gap-3">
                <span aria-hidden className="w-5 shrink-0 text-xs font-bold text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                <a href={`#${h.id}`} className="font-semibold leading-snug hover:text-madinah">{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {related.length > 0 && (
        <section className={card}>
          {head("Related stories")}
          <ul className="divide-y divide-hairline">{related.map((p) => <Story key={p.id} post={p} />)}</ul>
        </section>
      )}

      {videos.length > 0 && (
        <section className={card}>
          {head("Videos")}
          <ul className="divide-y divide-hairline">
            {videos.map((v) => (
              <li key={v.slug} className="group relative flex gap-3 py-3 first:pt-0 last:pb-0">
                <YtThumb id={v.youtubeId!} className="aspect-video w-24 shrink-0 object-cover" />
                <div className="min-w-0">
                  <h3 className="line-clamp-3 text-sm font-bold leading-snug"><Link href={`/video/${v.slug}`} className="after:absolute after:inset-0">{decode(v.title)}</Link></h3>
                  <p className="mt-1 text-xs text-neutral-600">{fmtDate(v.date)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/videos" className="mt-2 inline-block py-2.5 text-sm font-semibold text-madinah hover:underline">All videos →</Link>
        </section>
      )}

      {latest.length > 0 && (
        <section className={card}>
          {head("Latest stories")}
          <ul className="divide-y divide-hairline">{latest.map((p) => <Story key={p.id} post={p} />)}</ul>
        </section>
      )}
    </aside>
  );
}
