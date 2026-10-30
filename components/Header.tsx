import Image from "next/image";
import Link from "next/link";
import HideOnScroll from "@/components/HideOnScroll";
import NavLink from "@/components/NavLink";
import { allCategories } from "@/lib/data";

const order = ["hajj-umrah", "articles", "fatwa", "fiqh", "history-culture", "rituals"];
const cats = order.map((s) => allCategories.find((c) => c.slug === s)).filter((c) => c !== undefined);

export default function Header() {
  return (
    <HideOnScroll className="site-header sticky top-0 z-20 border-b border-hairline bg-ihram/90 shadow-[0_1px_0_0_var(--color-gold-light)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 xl:flex-nowrap xl:gap-x-3 px-4 py-1.5 sm:py-2">
        <Link href="/" aria-label="Hajj and Umrah home" className="shrink-0">
          <Image src="/uploads/2022/06/logo-hajj.png" alt="Hajj and Umrah" width={300} height={112} priority className="h-[38px] w-auto sm:h-[46px]" />
        </Link>
        <form action="/search" role="search" className="order-2 ml-auto flex min-w-0 max-w-48 flex-1 sm:flex-none xl:order-3">
          <input
            name="q"
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="w-full min-w-0 rounded-l-full border border-r-0 border-hairline bg-white px-4 py-1.5 text-sm outline-none transition-all focus:border-gold sm:w-32 sm:flex-none sm:focus:w-44 xl:focus:w-32"
          />
          <button aria-label="Search" className="flex w-[44px] shrink-0 items-center justify-center rounded-r-full bg-ink text-gold-light transition-colors hover:bg-ink-soft">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>
        <nav aria-label="Main" className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 [scrollbar-width:none] max-md:pr-10 max-md:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] xl:order-2 xl:mx-0 xl:w-auto xl:flex-1 xl:justify-center xl:gap-0 xl:overflow-visible">
          <NavLink href="/">Home</NavLink>
          {cats.map((c) => <NavLink key={c.slug} href={`/${c.slug}`}>{c.name}</NavLink>)}
          <NavLink href="/videos">Videos</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>
      </div>
    </HideOnScroll>
  );
}
