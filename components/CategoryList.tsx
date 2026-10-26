import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getCategory, pageCount, postsIn, slicePage } from "@/lib/data";

export default function CategoryList({ category, page }: { category: string; page: number }) {
  const cat = getCategory(category);
  const posts = postsIn(category);
  const total = pageCount(posts.length);
  if (!cat || !Number.isInteger(page) || page < 1 || page > total) notFound();
  return (
    <>
      <PageTitle sub={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}>{cat.name}</PageTitle>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {slicePage(posts, page).map((p) => <PostCard key={p.id} post={p} />)}
      </div>
      <Pagination base={`/${category}`} page={page} total={total} />
    </>
  );
}
