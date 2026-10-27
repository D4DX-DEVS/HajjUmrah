"use client";
import { useEffect, useState } from "react";
import { api, decodeEntities, nowLocal, slugify, youtubeId } from "./api";
import { btn, field } from "./ui";

type Video = { slug: string; title: string; date: string; youtubeId: string; image: null };

export default function VideosView({ onError }: { onError: (e: unknown) => void }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [sha, setSha] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    api<{ sha: string; videos: Video[] }>("videos")
      .then((r) => {
        setSha(r.sha);
        setVideos(r.videos);
      })
      .catch((e) => {
        onError(e);
        setErr((e as Error).message);
      });
  }, [onError]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const id = youtubeId(url);
    if (!id) return setErr("That does not look like a YouTube link or id.");
    const s = slug.trim() || slugify(title);
    if (!s) return setErr("Add a URL part (slug): the title has no English words.");
    setErr("");
    setVideos([{ slug: s, title: title.trim(), date: nowLocal() + ":00", youtubeId: id, image: null }, ...(videos ?? [])]);
    setUrl("");
    setTitle("");
    setSlug("");
    setOk("");
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ sha: string; commitUrl: string }>("videos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sha, videos }) });
      setSha(r.sha);
      setOk(r.commitUrl);
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  if (!videos) return <p className="text-neutral-500">{err || "Loading videos..."}</p>;
  return (
    <div className="space-y-5">
      {err && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      {ok && <p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">Saved to GitHub (<a href={ok} target="_blank" rel="noreferrer" className="underline">commit</a>). The site updates in about 2-3 minutes.</p>}
      <form onSubmit={add} className="grid gap-3 rounded border border-black/10 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-medium">YouTube link<input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className={field} /></label>
        <label className="text-sm font-medium">Title<input value={title} onChange={(e) => setTitle(e.target.value)} required className={field} /></label>
        <label className="text-sm font-medium">URL part (optional)<input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title) || "needed for non-English titles"} className={field} /></label>
        <div className="flex items-end"><button className={btn}>Add to list</button></div>
      </form>
      <ul className="divide-y divide-black/5 rounded border border-black/10 bg-white">
        {videos.map((v) => (
          <li key={v.slug} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{decodeEntities(v.title)}</p>
              <p className="text-xs text-neutral-500">{v.youtubeId} · {v.date.slice(0, 10)}</p>
            </div>
            <button onClick={() => confirm("Remove this video from the list?") && setVideos(videos.filter((x) => x !== v))} className="text-sm text-red-700 hover:underline">Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={save} disabled={busy} className={btn}>{busy ? "Saving..." : "Save videos"}</button>
      <p className="text-xs text-neutral-500">Add or remove entries above, then save once. Nothing changes on the site until you save.</p>
    </div>
  );
}
