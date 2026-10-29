import Image from "next/image";
import Link from "next/link";
import NavLink from "@/components/NavLink";
import { allCategories } from "@/lib/data";

const order = ["hajj-umrah", "articles", "fatwa", "fiqh", "history-culture", "rituals"];
const cats = order.map((s) => allCategories.find((c) => c.slug === s)).filter((c) => c !== undefined);

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" aria-label="Hajj and Umrah home" className="shrink-0">
          <Image src="/uploads/2022/06/logo-hajj.png" alt="Hajj and Umrah" width={300} height={112} priority className="h-11 w-auto" />
        </Link>
        <form action="/search" role="search" className="order-2 ml-auto xl:order-3">
          <input
            name="q"
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="w-32 rounded-full bg-neutral-100 px-4 py-1.5 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-600 sm:w-36 sm:focus:w-44"
          />
        </form>
        <nav aria-label="Main" className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 [scrollbar-width:none] max-md:pr-10 max-md:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] xl:order-2 xl:mx-0 xl:w-auto xl:flex-1 xl:justify-center xl:overflow-visible">
          <NavLink href="/">Home</NavLink>
          {cats.map((c) => <NavLink key={c.slug} href={`/${c.slug}`}>{c.name}</NavLink>)}
          <NavLink href="/videos">Videos</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>
      </div>
    </header>
  );
}
