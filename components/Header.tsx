import Link from "next/link";
import { allCategories } from "@/lib/data";

const order = ["hajj-umrah", "articles", "fatwa", "fiqh", "history-culture", "rituals"];
const cats = order.map((s) => allCategories.find((c) => c.slug === s)).filter((c) => c !== undefined);

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/2022/06/logo-hajj.png" alt="Hajj and Umrah" className="h-10 w-auto" />
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          {cats.map((c) => (
            <Link key={c.slug} href={`/${c.slug}`} className="hover:text-emerald-700">{c.name}</Link>
          ))}
          <Link href="/videos" className="hover:text-emerald-700">Videos</Link>
          <Link href="/about" className="hover:text-emerald-700">About</Link>
          <Link href="/contact" className="hover:text-emerald-700">Contact</Link>
          <a href="https://islamonlive.in" className="hover:text-emerald-700">islamonlive.in</a>
        </nav>
        <form action="/search" className="ml-auto">
          <input name="q" type="search" placeholder="Search" aria-label="Search" className="w-36 rounded border border-black/20 px-2 py-1 text-sm" />
        </form>
      </div>
    </header>
  );
}
