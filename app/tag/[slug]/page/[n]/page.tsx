import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { allTags, getTag, pageCount, postsTagged } from "@/lib/data";

export const instant = false;

// page 1 lives at /tag/[slug]; only emit 2..N
export const generateStaticParams = () =>
  allTags.flatMap((t) =>
    Array.from({ length: pageCount(postsTagged(t.slug).length) - 1 }, (_, i) => ({ slug: t.slug, n: String(i + 2) })),
  );

export async function generateMetadata({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  return { title: `${getTag(slug)?.name} - Page ${n}` };
}

export default async function TagPageN({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  const tag = getTag(slug);
  if (!tag) notFound();
  return <PostList title={`#${tag.name}`} posts={postsTagged(tag.slug)} base={`/tag/${tag.slug}`} page={Number(n)} />;
}
