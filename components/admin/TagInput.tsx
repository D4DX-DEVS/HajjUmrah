"use client";
import { useId, useState } from "react";
import { IconX, input } from "./ui";

// Tags as removable chips. Enter or comma adds one; Backspace on an empty box removes the last.
export default function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState("");
  const list = useId();

  function add(raw: string) {
    const name = raw.trim().replace(/^#/, "");
    if (name && !value.some((v) => v.toLowerCase() === name.toLowerCase()) && value.length < 20) onChange([...value, name]);
    setText("");
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-2.5 pr-1 text-sm text-emerald-900">
              {t}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove tag ${t}`} className="rounded-full p-0.5 text-emerald-700 hover:bg-emerald-100">
                <IconX className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={text}
        list={list}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value.slice(0, -1)) : setText(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); add(text); }
          else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        placeholder={value.length ? "Add another..." : "Type a tag, press Enter"}
        className={input}
      />
      <datalist id={list}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}
