import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { getData } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/tag/[slug]">) {
  const { getTag, postsTagged } = await getData();
  const tag = getTag((await params).slug);
  return { title: `#${tag?.name}`, description: `${postsTagged(tag?.slug ?? "").length} Malayalam posts tagged ${tag?.name} on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/tag/${tag?.slug}` } };
}

export default async function TagPage({ params }: PageProps<"/tag/[slug]">) {
  const { getTag, postsTagged } = await getData();
  const tag = getTag((await params).slug);
  if (!tag) notFound();
  return <PostList title={`#${tag.name}`} posts={postsTagged(tag.slug)} base={`/tag/${tag.slug}`} page={1} />;
}
