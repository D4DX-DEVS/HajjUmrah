"use client";
import { useState } from "react";

const field = "mt-1 w-full border-0 border-b-2 border-hairline bg-transparent px-0 py-2 text-base outline-none transition-colors focus:border-gold";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      setState(r.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "ok") return <p className="border-l-4 border-gold bg-madinah-wash p-4 text-madinah-deep">Thank you, your message has been sent.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold">Name<input name="name" autoComplete="name" required maxLength={100} className={field} /></label>
      <label className="block text-sm font-semibold">Email<input name="email" type="email" autoComplete="email" required maxLength={200} className={field} /></label>
      <label className="block text-sm font-semibold">Message<textarea name="message" required maxLength={5000} rows={6} className={field} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button disabled={state === "sending"} className="bg-ink px-7 py-3 font-semibold text-gold-light transition-colors hover:bg-ink-soft disabled:opacity-60">
        {state === "sending" ? "Sending..." : "Send"}
      </button>
      {state === "error" && <p className="text-sm text-red-700">Could not send. Please try again later.</p>}
    </form>
  );
}
