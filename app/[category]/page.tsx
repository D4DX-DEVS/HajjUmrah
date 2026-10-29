import CategoryList from "@/components/CategoryList";
import { allCategories, getCategory, postsIn } from "@/lib/data";

export const generateStaticParams = () => allCategories.map((c) => ({ category: c.slug }));

export async function generateMetadata({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  const name = getCategory(category)?.name;
  return { title: name, description: `${name}: ${postsIn(category).length} Malayalam posts on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/${category}` } };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  return <CategoryList category={category} page={1} />;
}
