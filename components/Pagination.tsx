import Link from "next/link";

export default function Pagination({ base, page, total }: { base: string; page: number; total: number }) {
  if (total < 2) return null;
  const href = (n: number) => (n === 1 ? base : `${base}/page/${n}`);
  const box = "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} className={`${box} hover:bg-madinah-wash`}>← Prev</Link>}
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={`${box} ${n === page ? "bg-ink font-semibold text-gold-light" : "hover:bg-madinah-wash"}`}
        >
          {n}
        </Link>
      ))}
      {page < total && <Link href={href(page + 1)} className={`${box} hover:bg-madinah-wash`}>Next →</Link>}
    </nav>
  );
}
