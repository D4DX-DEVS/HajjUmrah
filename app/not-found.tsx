import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-8xl font-black text-gold">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold">This page could not be found.</h1>
      <Link href="/" className="mt-4 inline-block py-3 font-semibold text-madinah hover:underline">Back to home</Link>
    </div>
  );
}
