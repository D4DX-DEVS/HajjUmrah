import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import { allPosts, decode, postHref } from "@/lib/data";

export const metadata = { title: "Search" };

const index = allPosts.map((p) => ({ t: decode(p.title), e: decode(p.excerpt), h: postHref(p) }));

export default function Search() {
  return (
    <>
      <h1 className="mb-6 border-b-2 border-emerald-700 pb-2 text-2xl font-bold">Search</h1>
      <Suspense>
        <SearchResults index={index} />
      </Suspense>
    </>
  );
}
