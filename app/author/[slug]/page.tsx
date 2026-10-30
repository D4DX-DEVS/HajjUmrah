import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import PostCard from "@/components/PostCard";
import { authorBio, authors, postsBy } from "@/lib/data";

export const generateStaticParams = () => authors.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const name = authors.find((a) => a.slug === slug)?.name;
  const bio = authorBio(slug)?.replace(/s+/g, " ").trim();
  return { title: name, description: bio ? bio.slice(0, 155) : `Posts by ${name} on Hajj and Umrah in Malayalam (${postsBy(slug).length}).`, alternates: { canonical: `/author/${slug}` } };
}

export default async function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const author = authors.find((a) => a.slug === slug);
  if (!author) notFound();
  const posts = postsBy(slug);
  const bio = authorBio(slug);
  return (
    <>
      <PageTitle sub={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}>{author.name}</PageTitle>
      {bio && <p className="-mt-4 mb-8 max-w-2xl whitespace-pre-line text-neutral-700">{bio}</p>}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => <PostCard key={p.id} post={p} as="h2" />)}
      </div>
    </>
  );
}
