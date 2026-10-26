import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { allTags, getTag, postsTagged } from "@/lib/data";

export const instant = false;

export const generateStaticParams = () => allTags.map((t) => ({ slug: t.slug }));

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  return { title: getTag(slug)?.name };
}

export default async function TagPage({ params }: PageProps<"/tag/[slug]">) {
  const tag = getTag((await params).slug);
  if (!tag) notFound();
  return <PostList title={`#${tag.name}`} posts={postsTagged(tag.slug)} base={`/tag/${tag.slug}`} page={1} />;
}
