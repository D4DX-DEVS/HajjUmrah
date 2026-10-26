import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import PostCard from "@/components/PostCard";
import { authors, postsBy } from "@/lib/data";

// every param value is prerendered via generateStaticParams; silences the dev-only instant-nav warning on `params`
export const instant = false;

export const generateStaticParams = () => authors.map((a) => ({ slug: a.slug }));

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) notFound();
  const posts = postsBy(slug);
  return (
    <>
      <PageTitle sub={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}>{author.name}</PageTitle>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}
