import Link from "next/link";

// The rub el hizb (two overlapping squares), used as the section mark.
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="9" y="9" width="22" height="22" />
      <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
      <circle cx="20" cy="20" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SectionHeader({ title, blurb, href, dark }: { title: string; blurb?: string; href?: string; dark?: boolean }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {blurb && <Mark className="h-11 w-11 shrink-0 text-gold" />}
          <h2 className={`font-display text-2xl font-extrabold tracking-tight sm:text-3xl ${dark ? "text-white" : ""}`}>{title}</h2>
        </div>
        {href && (
          <Link href={href} className={`group -my-2 flex shrink-0 items-center gap-1.5 py-2 text-sm font-semibold ${dark ? "text-gold-light" : "text-madinah"}`}>
            <span className="sweep pb-0.5">View all</span>
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        )}
      </div>
      {blurb && <p className={`mt-2 text-sm ${blurb ? "sm:ml-[3.75rem]" : ""} ${dark ? "text-white/70" : "text-neutral-600"}`}>{blurb}</p>}
      <span className={`rule-view mt-3 block h-0.5 w-16 bg-gold ${blurb ? "sm:ml-[3.75rem]" : ""}`} aria-hidden />
    </div>
  );
}
