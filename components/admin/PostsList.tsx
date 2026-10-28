"use client";
import { useState } from "react";
import type { Index } from "./api";
import { IconChevron, IconPlus, IconSearch, btnPrimary, input } from "./ui";

const PAGE = 30;

export default function PostsList({ index, onOpen }: { index: Index; onOpen: (id?: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [shown, setShown] = useState(PAGE);
  const catName = (slug: string) => index.categories.find((c) => c.slug === slug)?.name ?? slug;
  const needle = q.trim().toLowerCase();
  const rows = index.posts.filter((p) => (!cat || p.category === cat) && (!needle || (p.title + " " + p.slug).toLowerCase().includes(needle)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Posts</h2>
          <p className="text-sm text-neutral-500">{index.posts.length} published. Changes you save appear here after the site rebuilds.</p>
        </div>
        <button onClick={() => onOpen()} className={btnPrimary}><IconPlus /> New post</button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Search posts</span>
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search by title or URL" className={`${input} pl-9`} />
        </label>
        <label className="sm:w-52">
          <span className="sr-only">Category</span>
          <select value={cat} onChange={(e) => { setCat(e.target.value); setShown(PAGE); }} className={input}>
            <option value="">All categories</option>
            {index.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <ul className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {rows.slice(0, shown).map((p) => (
          <li key={p.id}>
            <button onClick={() => onOpen(p.id)} className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50/60 focus-visible:bg-emerald-50 focus-visible:outline-none">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-neutral-900">{p.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">{catName(p.category)}</span>
                  <span>{p.date.slice(0, 10)}</span>
                </span>
              </span>
              <IconChevron className="h-4 w-4 text-neutral-300 group-hover:text-emerald-700" />
            </button>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-10 text-center text-sm text-neutral-500">No posts match your search.</li>}
      </ul>

      {rows.length > shown && (
        <div className="text-center">
          <button onClick={() => setShown(shown + PAGE)} className="text-sm font-medium text-emerald-700 hover:underline">
            Show more ({rows.length - shown} left)
          </button>
        </div>
      )}
    </div>
  );
}
