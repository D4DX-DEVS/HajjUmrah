import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import SectionHeader from "@/components/SectionHeader";
import { allPosts, decode, fmtDate, getCategory, getPost, postsIn } from "@/lib/data";

// every post is prerendered via generateStaticParams; silences the dev-only instant-nav warning on `params`
export const instant = false;

export const generateStaticParams = () => allPosts.map((p) => ({ category: p.category, slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) return {};
  return {
    title: decode(post.title),
    description: decode(post.excerpt).slice(0, 160),
    alternates: { canonical: `/${category}/${slug}` },
    openGraph: { type: "article", publishedTime: post.date, images: post.image ? [post.image] : [] },
  };
}

export default async function PostPage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) notFound();
  const related = postsIn(category).filter((p) => p.id !== post.id).slice(0, 3);
  return (
    <>
      <article className="mx-auto max-w-2xl">
        <Link href={`/${category}`} className="text-xs font-medium uppercase tracking-wide text-emerald-700 hover:underline">{getCategory(category)?.name}</Link>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{decode(post.title)}</h1>
        <p className="mt-4 text-sm text-neutral-500">
          <Link href={`/author/${post.author.slug}`} className="font-medium text-neutral-700 hover:text-emerald-700">{post.author.name}</Link> · {fmtDate(post.date)}
        </p>
        {post.image && (
          <Image src={post.image} alt="" width={1200} height={750} priority sizes="(min-width:672px) 672px, 100vw" className="my-8 h-auto w-full rounded-2xl" />
        )}
        <div className="wp-content" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      {related.length > 0 && (
        <section className="mt-16 border-t border-black/5 pt-10">
          <SectionHeader title="Related" href={`/${category}`} />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
