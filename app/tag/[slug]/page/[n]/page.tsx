import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { allTags, getTag, pageCount, postsTagged } from "@/lib/data";

// page 1 lives at /tag/[slug]; only emit 2..N
export const generateStaticParams = () =>
  allTags.flatMap((t) =>
    Array.from({ length: pageCount(postsTagged(t.slug).length) - 1 }, (_, i) => ({ slug: t.slug, n: String(i + 2) })),
  );

export async function generateMetadata({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  const tag = getTag(slug);
  return { title: `#${tag?.name} - Page ${n}`, description: `Posts tagged ${tag?.name} on Hajj and Umrah, page ${n} of ${pageCount(postsTagged(tag?.slug ?? "").length)}.`, alternates: { canonical: `/tag/${tag?.slug}/page/${n}` } };
}

export default async function TagPageN({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  const tag = getTag(slug);
  if (!tag) notFound();
  return <PostList title={`#${tag.name}`} posts={postsTagged(tag.slug)} base={`/tag/${tag.slug}`} page={Number(n)} />;
}
