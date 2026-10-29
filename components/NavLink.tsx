"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-emerald-700 text-white" : "text-neutral-700 hover:bg-emerald-50 hover:text-emerald-800"
      }`}
    >
      {children}
    </Link>
  );
}
