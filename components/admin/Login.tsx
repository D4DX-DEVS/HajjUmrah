"use client";
import { useState } from "react";
import { api } from "./api";
import { IconEye, Notice, btnPrimary, input } from "./ui";

export default function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/islamonlive-logo.png" alt="islamonlive" width={298} height={81} className="mb-4 h-10 w-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Sign in to manage posts and videos.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Password</span>
          <span className="relative block">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete="current-password"
              required
              autoFocus
              className={`${input} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-neutral-500 hover:text-neutral-800"
            >
              <IconEye off={show} />
            </button>
          </span>
        </label>
        {err && <Notice kind="error">{err}</Notice>}
        <button disabled={busy || !pw} className={`${btnPrimary} w-full`}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
