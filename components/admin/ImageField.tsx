"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { api, imageSrc } from "./api";
import { IconUpload, input } from "./ui";

// Featured image: a preview with Replace/Remove, or an upload box. A link can be pasted instead.
export default function ImageField({ value, onChange, onError }: { value: string; onChange: (v: string) => void; onError: (e: unknown) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(""); // address of a file just uploaded

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ path: string; url: string }>("upload", { method: "POST", headers: { "x-filename": encodeURIComponent(file.name), "content-type": file.type }, body: file });
      onChange(r.path);
      setPreview(r.url);
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  const picker = (
    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={busy} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
  );

  return (
    <div className="space-y-2">
      {value ? (
        <figure className="overflow-hidden rounded-lg border border-neutral-200">
          <img src={preview || imageSrc(value)} alt="Featured" className="aspect-[16/10] w-full bg-neutral-100 object-cover" />
          <figcaption className="flex items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
            <label className="cursor-pointer font-medium text-emerald-700 hover:underline focus-within:underline">
              {busy ? "Uploading..." : "Replace"}
              {picker}
            </label>
            <button type="button" onClick={() => { onChange(""); setPreview(""); }} className="font-medium text-red-700 hover:underline">Remove</button>
          </figcaption>
        </figure>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 px-3 py-6 text-center text-sm text-neutral-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 focus-within:border-emerald-600">
          <IconUpload className="h-6 w-6 text-neutral-400" />
          <span className="font-medium text-neutral-800">{busy ? "Uploading..." : "Upload an image"}</span>
          <span className="text-xs text-neutral-500">JPEG, PNG, GIF or WebP, up to 4 MB</span>
          {picker}
        </label>
      )}
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-500 hover:text-neutral-800">Use a link instead</summary>
        <input value={value} onChange={(e) => { onChange(e.target.value.trim()); setPreview(""); }} placeholder="https://... or /uploads/..." className={`${input} mt-2`} />
      </details>
    </div>
  );
}
