"use client";
import { useState } from "react";

const field = "w-full rounded border border-black/20 bg-white px-3 py-2";

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

  if (state === "ok") return <p className="rounded bg-emerald-50 p-4 text-emerald-800">Thank you, your message has been sent.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium">Name<input name="name" autoComplete="name" required maxLength={100} className={field} /></label>
      <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required maxLength={200} className={field} /></label>
      <label className="block text-sm font-medium">Message<textarea name="message" required maxLength={5000} rows={6} className={field} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button disabled={state === "sending"} className="rounded bg-emerald-700 px-5 py-2 font-medium text-white disabled:opacity-60">
        {state === "sending" ? "Sending..." : "Send"}
      </button>
      {state === "error" && <p className="text-sm text-red-700">Could not send. Please try again later.</p>}
    </form>
  );
}
