"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || (href !== "/" && path.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative whitespace-nowrap px-3 py-2.5 text-[15px] font-semibold transition-colors ${active ? "text-ink" : "text-neutral-600 hover:text-ink"}`}
    >
      {children}
      <span aria-hidden className={`absolute inset-x-3 bottom-1 h-0.5 origin-left bg-gold transition-transform duration-500 ease-out ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
    </Link>
  );
}
