import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { getData, pageCount } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  const { getTag, postsTagged } = await getData();
  const tag = getTag(slug);
  return { title: `#${tag?.name} - Page ${n}`, description: `Posts tagged ${tag?.name} on Hajj and Umrah, page ${n} of ${pageCount(postsTagged(tag?.slug ?? "").length)}.`, alternates: { canonical: `/tag/${tag?.slug}/page/${n}` } };
}

export default async function TagPageN({ params }: PageProps<"/tag/[slug]/page/[n]">) {
  const { slug, n } = await params;
  const { getTag, postsTagged } = await getData();
  const tag = getTag(slug);
  if (!tag) notFound();
  return <PostList title={`#${tag.name}`} posts={postsTagged(tag.slug)} base={`/tag/${tag.slug}`} page={Number(n)} />;
}
