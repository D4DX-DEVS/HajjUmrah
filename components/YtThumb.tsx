"use client";
import { useState } from "react";

// YouTube serves a tiny placeholder (or 404) for removed/private videos; show a plain block instead.
export default function YtThumb({ id, className }: { id: string; className?: string }) {
  const [bad, setBad] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth <= 120) setBad(true);
  };
  if (bad) return <div aria-hidden className={`${className} bg-madinah-wash`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={check}
      src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
      alt=""
      loading="lazy"
      onLoad={(e) => check(e.currentTarget)}
      onError={() => setBad(true)}
      className={className}
    />
  );
}
