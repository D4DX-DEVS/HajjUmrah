import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, postHref, type Post } from "@/lib/data";

export default function PostRow({ post }: { post: Post }) {
  return (
    <article className="group relative flex items-center gap-4 py-4 lg:flex-1">
      <Link href={postHref(post)} tabIndex={-1} aria-hidden className="relative block h-24 w-32 shrink-0 lg:h-28 lg:w-40 overflow-hidden rounded-lg bg-emerald-50">
        {post.image && <Image src={post.image} alt="" fill sizes="128px" className="object-cover transition duration-300 group-hover:scale-105" />}
      </Link>
      <div className="min-w-0">
        <h3 className="line-clamp-3 text-lg font-semibold leading-snug">
          <Link href={postHref(post)} className="hover:text-emerald-700 after:absolute after:inset-0">{decode(post.title)}</Link>
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{post.author.name} · {fmtDate(post.date)}</p>
      </div>
    </article>
  );
}
