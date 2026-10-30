import CategoryList from "@/components/CategoryList";
import { getData } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const { getCategory, postsIn } = await getData();
  const name = getCategory(category)?.name;
  return { title: name, description: `${name}: ${postsIn(category).length} Malayalam posts on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/${category}` } };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  return <CategoryList category={category} page={1} />;
}
