import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, postHref, type Post } from "@/lib/data";

export default function PostRow({ post }: { post: Post }) {
  return (
    <article className="group flex gap-4 py-4 first:pt-0 last:pb-0">
      <Link href={postHref(post)} tabIndex={-1} aria-hidden className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-emerald-50">
        {post.image && <Image src={post.image} alt="" fill sizes="112px" className="object-cover transition duration-300 group-hover:scale-105" />}
      </Link>
      <div className="min-w-0">
        <h3 className="line-clamp-3 font-semibold leading-snug">
          <Link href={postHref(post)} className="hover:text-emerald-700">{decode(post.title)}</Link>
        </h3>
        <p className="mt-1 text-xs text-neutral-500">{post.author.name} · {fmtDate(post.date)}</p>
      </div>
    </article>
  );
}
