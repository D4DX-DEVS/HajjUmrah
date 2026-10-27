import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-bold text-emerald-700">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page could not be found.</h1>
      <Link href="/" className="mt-6 inline-block text-emerald-700 hover:underline">Back to home</Link>
    </div>
  );
}
