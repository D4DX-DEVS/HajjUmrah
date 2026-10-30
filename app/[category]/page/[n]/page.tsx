import CategoryList from "@/components/CategoryList";
import { getData, pageCount } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  const { getCategory, postsIn } = await getData();
  const name = getCategory(category)?.name;
  return { title: `${name} - Page ${n}`, description: `${name}: page ${n} of ${pageCount(postsIn(category).length)} of Malayalam posts on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/${category}/page/${n}` } };
}

export default async function CategoryPageN({ params }: PageProps<"/[category]/page/[n]">) {
  const { category, n } = await params;
  return <CategoryList category={category} page={Number(n)} />;
}
