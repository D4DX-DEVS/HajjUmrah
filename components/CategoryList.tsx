import { notFound } from "next/navigation";
import PostList from "@/components/PostList";
import { getData } from "@/lib/data";

export default async function CategoryList({ category, page }: { category: string; page: number }) {
  const { getCategory, postsIn } = await getData();
  const cat = getCategory(category);
  if (!cat) notFound();
  return <PostList title={cat.name} posts={postsIn(category)} base={`/${category}`} page={page} />;
}
