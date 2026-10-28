"use client";
import { usePathname } from "next/navigation";

// The public header, footer and back-to-top button are hidden on the admin screens.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : <>{children}</>;
}
