import Link from "next/link";

export default function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between">
      <h2 className="border-l-4 border-emerald-700 pl-3 text-xl font-bold">{title}</h2>
      {href && <Link href={href} className="text-sm font-medium text-emerald-700 hover:underline">View all →</Link>}
    </div>
  );
}
