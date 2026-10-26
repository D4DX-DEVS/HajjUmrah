import Link from "next/link";
import { allCategories } from "@/lib/data";

const link = "hover:text-emerald-700";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-neutral-600 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-neutral-900">Hajj and Umrah</p>
          <p className="mt-2 max-w-xs">Articles, fatwas, fiqh, history and rituals of Hajj and Umrah in Malayalam.</p>
        </div>
        <nav aria-label="Categories">
          <p className="font-semibold text-neutral-900">Categories</p>
          <ul className="mt-2 space-y-1">
            {allCategories.map((c) => (
              <li key={c.slug}><Link href={`/${c.slug}`} className={link}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className="font-semibold text-neutral-900">Site</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/videos" className={link}>Videos</Link></li>
            <li><Link href="/about" className={link}>About</Link></li>
            <li><Link href="/contact" className={link}>Contact</Link></li>
            <li><Link href="/privacy-policy" className={link}>Privacy &amp; Policy</Link></li>
            <li><a href="https://islamonlive.in" className={link}>islamonlive.in</a></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-black/5 py-4 text-center text-xs text-neutral-500">© islamonlive.in, 2026</p>
    </footer>
  );
}
