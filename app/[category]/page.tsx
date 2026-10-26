import CategoryList from "@/components/CategoryList";
import { allCategories, getCategory } from "@/lib/data";

// every param value is prerendered via generateStaticParams; silences the dev-only instant-nav warning on `params`
export const instant = false;

export const generateStaticParams = () => allCategories.map((c) => ({ category: c.slug }));

export async function generateMetadata({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  return { title: getCategory(category)?.name, alternates: { canonical: `/${category}` } };
}

export default async function CategoryPage({ params }: PageProps<"/[category]">) {
  const { category } = await params;
  return <CategoryList category={category} page={1} />;
}
