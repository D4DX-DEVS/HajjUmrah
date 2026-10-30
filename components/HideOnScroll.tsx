"use client";
import { useEffect, useRef, useState } from "react";

// Sticky header that slides away on phones while reading down the page and returns on any upward scroll.
export default function HideOnScroll({ className, children }: { className: string; children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last.current) > 8) {
        setHidden(y > 140 && y > last.current);
        last.current = y;
      }
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header onFocusCapture={() => setHidden(false)} className={`${className} transition-transform duration-300 ${hidden ? "max-md:-translate-y-full" : ""}`}>
      {children}
    </header>
  );
}
