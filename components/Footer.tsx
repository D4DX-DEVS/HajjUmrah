import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-white py-8 text-center text-sm text-neutral-600">
      <p>© islamonlive.in, 2026</p>
      <p className="mt-2 space-x-4">
        <Link href="/about" className="hover:underline">About</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
        <Link href="/privacy-policy" className="hover:underline">Privacy &amp; Policy</Link>
      </p>
    </footer>
  );
}
