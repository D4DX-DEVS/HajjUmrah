import Image from "next/image";

// Stands in for a missing picture: a tinted block with the site logo as a faint watermark.
// Fill a `relative` parent; `dark` is for blocks that sit on an ink or green band.
export default function ImagePlaceholder({ dark }: { dark?: boolean }) {
  return (
    <span aria-hidden className={`absolute inset-0 flex items-center justify-center ${dark ? "bg-ink-soft" : "bg-madinah-wash"}`}>
      <Image
        src="/uploads/2022/06/logo-hajj.png"
        alt=""
        width={300}
        height={112}
        className={`h-auto w-3/5 max-w-44 ${dark ? "opacity-25 brightness-0 invert" : "opacity-30 grayscale"}`}
      />
    </span>
  );
}
