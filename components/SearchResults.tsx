"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Item = { t: string; e: string; h: string };

export default function SearchResults({ index }: { index: Item[] }) {
  const q = (useSearchParams().get("q") ?? "").trim().toLowerCase();
  if (!q) return <p className="text-neutral-600">Enter a search term.</p>;
  const hits = index.filter((i) => (i.t + " " + i.e).toLowerCase().includes(q));
  if (!hits.length) return <p className="text-neutral-600">No results.</p>;
  return (
    <ul className="divide-y divide-hairline">
      {hits.map((i) => (
        <li key={i.h} className="py-4">
          <Link href={i.h} className="inline-block py-1.5 font-display text-lg font-extrabold [overflow-wrap:anywhere] hover:text-madinah">{i.t}</Link>
          <p className="line-clamp-2 text-sm text-neutral-600 [overflow-wrap:anywhere]">{i.e}</p>
        </li>
      ))}
    </ul>
  );
}
