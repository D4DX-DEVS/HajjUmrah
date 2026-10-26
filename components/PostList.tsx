import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { pageCount, slicePage, type Post } from "@/lib/data";

// Paginated grid of posts; page 1 lives at `base`, page n at `base/page/n`.
export default function PostList({ title, posts, base, page }: { title: string; posts: Post[]; base: string; page: number }) {
  const total = pageCount(posts.length);
  if (!Number.isInteger(page) || page < 1 || page > total) notFound();
  return (
    <>
      <PageTitle sub={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}>{title}</PageTitle>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {slicePage(posts, page).map((p) => <PostCard key={p.id} post={p} />)}
      </div>
      <Pagination base={base} page={page} total={total} />
    </>
  );
}
