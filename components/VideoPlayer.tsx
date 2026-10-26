"use client";
import { useState } from "react";
import YtThumb from "@/components/YtThumb";

// Thumbnail first; the YouTube iframe only loads on click.
export default function VideoPlayer({ id, title }: { id: string; title: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button onClick={() => setOn(true)} aria-label={`Play: ${title}`} className="group absolute inset-0">
          <YtThumb id={id} className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
