import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts, decode, fmtDate, getCategory, getPost } from "@/lib/data";

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
  return (
    <article className="mx-auto max-w-3xl">
      <Link href={`/${category}`} className="text-sm font-medium text-emerald-700 hover:underline">{getCategory(category)?.name}</Link>
      <h1 className="mt-2 text-3xl font-bold leading-tight">{decode(post.title)}</h1>
      <p className="mt-3 text-sm text-neutral-500">
        <Link href={`/author/${post.author.slug}`} className="hover:underline">{post.author.name}</Link> · {fmtDate(post.date)}
      </p>
      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt="" className="my-6 w-full rounded-lg" />
      )}
      <div className="wp-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
