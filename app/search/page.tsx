import { Suspense } from "react";
import PageTitle from "@/components/PageTitle";
import SearchResults from "@/components/SearchResults";
import { allPosts, decode, postHref } from "@/lib/data";

export const metadata = { title: "Search", description: "Search Hajj and Umrah articles, fatwas and videos in Malayalam.", robots: { index: false, follow: true } };

const index = allPosts.map((p) => ({ t: decode(p.title), e: decode(p.excerpt), h: postHref(p) }));

export default function Search() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle>Search</PageTitle>
      <Suspense>
        <SearchResults index={index} />
      </Suspense>
    </div>
  );
}
