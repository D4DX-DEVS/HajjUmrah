import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, getCategory, postHref, type Post } from "@/lib/data";

// Staggered entrance: --i orders the lines (category, title, meta).
function Tile({ post, big }: { post: Post; big?: boolean }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden bg-ink-soft ring-1 ring-gold/25 ${big ? "min-h-[26rem] sm:min-h-[34rem] lg:col-span-2 lg:row-span-2 lg:min-h-[36rem]" : "min-h-52"}`}>
      {post.image && (
        <Image src={post.image} alt="" fill priority={big} sizes={big ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, 100vw"} className={`object-cover opacity-90 transition duration-700 group-hover:opacity-100 ${big ? "hero-img" : "group-hover:scale-105"}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/5" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
        <span className="rise inline-block text-sm font-semibold text-gold-light" style={{ "--i": 0 } as React.CSSProperties}>{getCategory(post.category)?.name}</span>
        <span className="rule mt-2 block h-0.5 w-12 bg-gold" aria-hidden />
        <h2 className={`rise mt-3 font-display font-extrabold leading-tight ${big ? "text-3xl sm:text-5xl lg:text-[3.4rem]" : "line-clamp-3 text-xl"}`} style={{ "--i": 1 } as React.CSSProperties}>
          <span className="sweep pb-1">{decode(post.title)}</span>
        </h2>
        <p className="rise mt-3 text-sm text-white/75" style={{ "--i": 2 } as React.CSSProperties}>{post.author.name} · {fmtDate(post.date)}</p>
      </div>
    </Link>
  );
}

export default function Hero({ posts }: { posts: Post[] }) {
  const [main, ...rest] = posts;
  return (
    <section className="relative left-1/2 -mt-6 w-screen -translate-x-1/2 bg-ink sm:-mt-10">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:py-10 lg:grid-cols-3 lg:grid-rows-2">
        <Tile post={main} big />
        {rest.map((p) => <Tile key={p.id} post={p} />)}
      </div>
    </section>
  );
}
