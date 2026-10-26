import Link from "next/link";

export default function Pagination({ base, page, total }: { base: string; page: number; total: number }) {
  if (total < 2) return null;
  const href = (n: number) => (n === 1 ? base : `${base}/page/${n}`);
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2 text-sm">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? "page" : undefined}
          className={`rounded border px-3 py-1 ${n === page ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white hover:border-emerald-700"}`}
        >
          {n}
        </Link>
      ))}
    </nav>
  );
}
