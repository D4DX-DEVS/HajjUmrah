"use client";
import { useState } from "react";
import type { Index } from "./api";
import { IconPlus, IconSearch, btnPrimary, btnSecondary, input } from "./ui";

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
          <h2 className="font-display text-3xl font-black">Posts <span className="text-xl font-bold text-neutral-400">({index.posts.length})</span></h2>
          <p className="text-sm text-neutral-500">Changes you save appear here after the site rebuilds.</p>
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

      <div className="overflow-hidden rounded-sm border border-hairline bg-white shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_10rem_7.5rem_9.5rem] gap-4 border-b border-hairline bg-sand/50 px-4 py-3 text-sm font-bold text-ink xl:grid">
          <span>Title</span><span>Category</span><span>Date</span><span className="sr-only">Actions</span>
        </div>
        <ul className="divide-y divide-hairline">
          {rows.slice(0, shown).map((p) => (
            <li key={p.id} className="grid items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-madinah-wash/40 xl:grid-cols-[minmax(0,1fr)_10rem_7.5rem_9.5rem]">
              <span className="line-clamp-2 font-medium text-neutral-900 [overflow-wrap:anywhere]">{p.title}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 xl:contents">
                <span className="xl:truncate">{catName(p.category)}</span>
                <span className="tabular-nums">{p.date.slice(0, 10)}</span>
              </span>
              <span className="flex gap-2 xl:justify-end">
                <button onClick={() => onOpen(p.id)} className={`${btnSecondary} px-3 py-1.5`}>Edit</button>
                <a href={`/${p.category}/${p.slug}`} target="_blank" rel="noreferrer" className={`${btnSecondary} px-3 py-1.5`}>View</a>
              </span>
            </li>
          ))}
          {!rows.length && <li className="px-4 py-10 text-center text-sm text-neutral-500">No posts match your search.</li>}
        </ul>
      </div>

      {rows.length > shown && (
        <div className="text-center">
          <button onClick={() => setShown(shown + PAGE)} className="py-2.5 text-sm font-semibold text-madinah hover:underline">
            Show more ({rows.length - shown} left)
          </button>
        </div>
      )}
    </div>
  );
}
