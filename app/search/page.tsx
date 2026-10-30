import { Suspense } from "react";
import PageTitle from "@/components/PageTitle";
import SearchResults from "@/components/SearchResults";
import { decode, getData, postHref } from "@/lib/data";

export const metadata = { title: "Search", description: "Search Hajj and Umrah articles, fatwas and videos in Malayalam.", robots: { index: false, follow: true } };

export default async function Search() {
  const { allPosts } = await getData();
  const index = allPosts.map((p) => ({ t: decode(p.title), e: decode(p.excerpt), h: postHref(p) }));
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle>Search</PageTitle>
      <Suspense>
        <SearchResults index={index} />
      </Suspense>
    </div>
  );
}
