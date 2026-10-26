import CategoryList from "@/components/CategoryList";
import { allCategories, getCategory, pageCount, postsIn } from "@/lib/data";

// page 1 lives at /[category]; only emit 2..N
export const generateStaticParams = () =>
  allCategories.flatMap((c) =>
    Array.from({ length: pageCount(postsIn(c.slug).length) - 1 }, (_, i) => ({ category: c.slug, n: String(i + 2) })),
  );

export async function generateMetadata({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  return { title: `${getCategory(category)?.name} - Page ${n}` };
}

export default async function CategoryPageN({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  return <CategoryList category={category} page={Number(n)} />;
}
