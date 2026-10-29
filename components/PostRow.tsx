import Image from "next/image";
import Link from "next/link";
import { decode, fmtDate, postHref, type Post } from "@/lib/data";

export default function PostRow({ post }: { post: Post }) {
  return (
    <article className="group relative flex items-center gap-4 py-4 lg:flex-1">
      <Link href={postHref(post)} tabIndex={-1} aria-hidden className="relative block h-24 w-32 shrink-0 lg:h-28 lg:w-40 overflow-hidden bg-madinah-wash">
        {post.image && <Image src={post.image} alt="" fill sizes="128px" className="object-cover transition duration-700 ease-out group-hover:scale-105" />}
      </Link>
      <div className="min-w-0">
        <h3 className="line-clamp-3 font-display text-lg font-extrabold leading-snug">
          <Link href={postHref(post)} className="after:absolute after:inset-0"><span className="sweep pb-0.5">{decode(post.title)}</span></Link>
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{post.author.name} · {fmtDate(post.date)}</p>
      </div>
    </article>
  );
}
