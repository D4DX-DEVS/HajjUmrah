import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, getCategory, postHref, type Post } from "@/lib/data";

// lead: bigger title; wide: image beside text on large screens (section with no side list)
export default function PostCard({ post, lead, wide, as: H = "h3" }: { post: Post; lead?: boolean; wide?: boolean; as?: "h2" | "h3" }) {
  return (
    <article className={`group flex flex-col ${wide ? "lg:flex-row lg:items-center lg:gap-8" : ""}`}>
      <Link
        href={postHref(post)}
        tabIndex={-1}
        aria-hidden
        className={`relative block overflow-hidden rounded-xl bg-emerald-50 ${lead ? "aspect-video" : "aspect-[16/10]"} ${wide ? "lg:w-1/2 lg:shrink-0" : ""}`}
      >
        {post.image && (
          <Image src={post.image} alt="" fill sizes={lead ? "(min-width:1024px) 640px, 100vw" : "(min-width:1024px) 360px, (min-width:640px) 50vw, 100vw"} className="object-cover transition duration-300 group-hover:scale-105" />
        )}
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">{getCategory(post.category)?.name}</p>
        <H className={`font-semibold leading-snug ${lead ? "text-xl sm:text-2xl" : "text-lg"}`}>
          <Link href={postHref(post)} className="hover:text-emerald-700">{decode(post.title)}</Link>
        </H>
        <p className={`text-neutral-600 ${lead ? "line-clamp-3" : "line-clamp-2 text-sm"}`}>{decode(post.excerpt)}</p>
        <p className="mt-auto pt-1 text-xs text-neutral-500">
          <Link href={`/author/${post.author.slug}`} className="hover:text-emerald-700">{post.author.name}</Link> · {fmtDate(post.date)}
        </p>
      </div>
    </article>
  );
}
