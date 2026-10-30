"use client";
import { useState } from "react";
import { plainToHtml } from "./api";
import { input } from "./ui";

export type Mode = "text" | "html";

// Write / Preview tabs. Plain text mode needs no markup (a blank line starts a paragraph); HTML mode keeps the markup as typed.
export default function BodyEditor({ value, mode, onChange, onMode }: { value: string; mode: Mode; onChange: (v: string) => void; onMode: (m: Mode, v: string) => void }) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const html = mode === "html" ? value : plainToHtml(value);
  const tabBtn = (t: "write" | "preview", label: string) => (
    <button type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className={`rounded-md px-3.5 py-2 text-sm font-medium ${tab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex gap-1 rounded-sm bg-neutral-100 p-1">{tabBtn("write", "Write")}{tabBtn("preview", "Preview")}</div>
        {mode === "text" ? (
          <button type="button" onClick={() => onMode("html", plainToHtml(value))} className="text-sm text-neutral-500 hover:text-madinah hover:underline">
            Edit as HTML
          </button>
        ) : (
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">HTML mode</span>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          aria-label="Body"
          placeholder={mode === "text" ? "Write the post here. Leave a blank line between paragraphs." : "<p>HTML body</p>"}
          className={`${input} min-h-[22rem] leading-7 ${mode === "html" ? "font-mono text-sm" : ""}`}
        />
      ) : (
        // sandboxed: scripts in the body cannot run, and the preview cannot touch the admin page
        <iframe
          title="Preview"
          sandbox=""
          srcDoc={`<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{font:18px/1.9 system-ui,sans-serif;max-width:42rem;margin:1rem auto;padding:0 1rem;color:#262626}img,iframe,video{max-width:100%;height:auto}a{color:#047857}</style>${html || "<p style='color:#888'>Nothing to preview yet.</p>"}`}
          className="min-h-[22rem] w-full rounded-sm border border-hairline bg-white"
        />
      )}
      {mode === "html" && tab === "write" && <p className="mt-1 text-xs text-neutral-500">Scripts, event handlers and unsafe links are removed when you save.</p>}
    </div>
  );
}
