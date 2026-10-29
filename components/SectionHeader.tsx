import Link from "next/link";

export default function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        <span className="rule-view mt-2 block h-0.5 w-16 bg-gold" aria-hidden />
      </div>
      {href && <Link href={href} className="group -my-2 flex items-center gap-1.5 py-2 text-sm font-semibold text-madinah"><span className="sweep pb-0.5">View all</span><span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span></Link>}
    </div>
  );
}
