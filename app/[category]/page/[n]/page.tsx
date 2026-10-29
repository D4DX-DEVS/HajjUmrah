import CategoryList from "@/components/CategoryList";
import { allCategories, getCategory, pageCount, postsIn } from "@/lib/data";

// page 1 lives at /[category]; only emit 2..N
export const generateStaticParams = () =>
  allCategories.flatMap((c) =>
    Array.from({ length: pageCount(postsIn(c.slug).length) - 1 }, (_, i) => ({ category: c.slug, n: String(i + 2) })),
  );

export async function generateMetadata({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  const name = getCategory(category)?.name;
  return { title: `${name} - Page ${n}`, description: `${name}: page ${n} of ${pageCount(postsIn(category).length)} of Malayalam posts on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/${category}/page/${n}` } };
}

export default async function CategoryPageN({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  return <CategoryList category={category} page={Number(n)} />;
}
