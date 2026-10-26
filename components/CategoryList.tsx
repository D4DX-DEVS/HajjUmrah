import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { getCategory, postsIn } from "@/lib/data";

export default function CategoryList({ category, page }: { category: string; page: number }) {
  const cat = getCategory(category);
  if (!cat) notFound();
  return <PostList title={cat.name} posts={postsIn(category)} base={`/${category}`} page={page} />;
}
