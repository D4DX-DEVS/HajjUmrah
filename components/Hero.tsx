import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, getCategory, postHref, type Post } from "@/lib/data";

function Tile({ post, big }: { post: Post; big?: boolean }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden rounded-2xl bg-emerald-900 ${big ? "min-h-72 sm:min-h-96 lg:col-span-2 lg:row-span-2 lg:min-h-0" : "min-h-44"}`}>
      {post.image && (
        <Image src={post.image} alt="" fill priority={big} sizes={big ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, 100vw"} className="object-cover transition duration-500 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
        <span className="inline-block rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium uppercase tracking-wide">{getCategory(post.category)?.name}</span>
        <h2 className={`mt-1 font-bold leading-snug ${big ? "text-xl sm:text-3xl" : "line-clamp-3 text-lg"}`}>{decode(post.title)}</h2>
        <p className="mt-1 text-xs text-white/70">{post.author.name} · {fmtDate(post.date)}</p>
      </div>
    </Link>
  );
}

export default function Hero({ posts }: { posts: Post[] }) {
  const [main, ...rest] = posts;
  return (
    <section className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
      <Tile post={main} big />
      {rest.map((p) => <Tile key={p.id} post={p} />)}
    </section>
  );
}
