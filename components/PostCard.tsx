import Link from "next/link";
import { decode, fmtDate, postHref, type Post } from "@/lib/data";

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-white">
      <Link href={postHref(post)} className="block aspect-[16/10] overflow-hidden bg-emerald-50">
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold leading-snug">
          <Link href={postHref(post)} className="hover:text-emerald-700">{decode(post.title)}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-neutral-600">{decode(post.excerpt)}</p>
        <p className="mt-auto pt-2 text-xs text-neutral-500">
          <Link href={`/author/${post.author.slug}`} className="hover:underline">{post.author.name}</Link> · {fmtDate(post.date)}
        </p>
      </div>
    </article>
  );
}
