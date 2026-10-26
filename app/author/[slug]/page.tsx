import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import { authors, postsBy } from "@/lib/data";

export const generateStaticParams = () => authors.map((a) => ({ slug: a.slug }));

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) notFound();
  return (
    <>
      <h1 className="mb-6 border-b-2 border-emerald-700 pb-2 text-2xl font-bold">{author.name}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {postsBy(slug).map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}
