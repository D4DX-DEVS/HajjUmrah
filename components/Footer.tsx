import Link from "next/link";
import { allCategories } from "@/lib/data";

const link = "inline-block py-2.5 text-white/75 transition-colors hover:text-gold-light";
const head = "font-display text-base font-extrabold text-gold-light";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm sm:grid-cols-3">
        <div>
          <p className="font-display text-3xl font-black leading-tight text-gold-light">Hajj and Umrah</p>
          <p className="mt-3 max-w-xs text-white/75">Articles, fatwas, fiqh, history and rituals of Hajj and Umrah in Malayalam.</p>
        </div>
        <nav aria-label="Categories">
          <p className={head}>Categories</p>
          <ul className="mt-2 space-y-0">
            {allCategories.map((c) => (
              <li key={c.slug}><Link href={`/${c.slug}`} className={link}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className={head}>Site</p>
          <ul className="mt-2 space-y-0">
            <li><Link href="/videos" className={link}>Videos</Link></li>
            <li><Link href="/about" className={link}>About</Link></li>
            <li><Link href="/contact" className={link}>Contact</Link></li>
            <li><Link href="/privacy-policy" className={link}>Privacy &amp; Policy</Link></li>
            <li><Link href="/admin" rel="nofollow" className={link}>Admin</Link></li>
            <li><a href="https://islamonlive.in" className={link}>islamonlive.in</a></li>
          </ul>
        </nav>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-sm text-white/60">© islamonlive.in, 2026</p>
    </footer>
  );
}
