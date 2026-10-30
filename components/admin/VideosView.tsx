"use client";
import { useEffect, useState } from "react";
import YtThumb from "../YtThumb";
import { api, decodeEntities, nowLocal, slugify, youtubeId } from "./api";
import { Card, Field, IconPlus, IconX, Notice, btnPrimary, btnSecondary, input } from "./ui";

type Video = { slug: string; title: string; date: string; youtubeId: string; image: null };

export default function VideosView({ onNotify, onError }: { onNotify: (text: string, href?: string) => void; onError: (e: unknown) => void }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [saved, setSaved] = useState("");
  const [sha, setSha] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ sha: string; videos: Video[] }>("videos")
      .then((r) => {
        setSha(r.sha);
        setVideos(r.videos);
        setSaved(JSON.stringify(r.videos));
      })
      .catch((e) => {
        onError(e);
        setErr((e as Error).message);
      });
  }, [onError]);

  const dirty = videos != null && JSON.stringify(videos) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const needsSlug = !!title.trim() && !slugify(title);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const id = youtubeId(url);
    if (!id) return setErr("That does not look like a YouTube link or id.");
    const s = slug.trim() || slugify(title);
    if (!s) return setErr("Add a URL (English letters): the title has no English words.");
    if (videos?.some((v) => v.slug === s)) return setErr("A video with that URL already exists. Change the URL.");
    setErr("");
    setVideos([{ slug: s, title: title.trim(), date: nowLocal() + ":00", youtubeId: id, image: null }, ...(videos ?? [])]);
    setUrl("");
    setTitle("");
    setSlug("");
  }

  async function save() {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ sha: string }>("videos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sha, videos }) });
      setSha(r.sha);
      setSaved(JSON.stringify(videos));
      onNotify("Videos saved. They are live on the site now.");
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  if (!videos) return <p className="py-20 text-center text-sm text-neutral-500">{err || "Loading videos..."}</p>;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black">Videos <span className="text-base font-normal text-neutral-500">{videos.length}</span></h1>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
          <button type="button" onClick={save} disabled={busy || !dirty} className={btnPrimary}>{busy ? "Saving..." : "Save videos"}</button>
        </div>
      </div>

      {err && <Notice kind="error">{err}</Notice>}

      <Card title="Add a video">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field label="YouTube link"><input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://www.youtube.com/watch?v=..." className={input} /></Field>
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} required className={input} /></Field>
          {needsSlug && (
            <Field label="URL" hint="English lowercase letters and dashes. Needed because the title has no English words.">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} required className={input} />
            </Field>
          )}
          <div className="flex items-end sm:col-span-2">
            <button className={btnSecondary}><IconPlus /> Add to list</button>
          </div>
        </form>
      </Card>

      {videos.length === 0 ? (
        <p className="rounded-sm border border-dashed border-hairline py-12 text-center text-sm text-neutral-500">No videos yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.slug} className="overflow-hidden rounded-sm border border-hairline bg-white shadow-sm">
              <YtThumb id={v.youtubeId} className="aspect-video w-full object-cover" />
              <div className="flex items-start gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium leading-snug">{decodeEntities(v.title)}</p>
                  <p className="mt-1 text-xs text-neutral-500">{v.date.slice(0, 10)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${decodeEntities(v.title)}`}
                  onClick={() => confirm("Remove this video from the list?") && setVideos(videos.filter((x) => x !== v))}
                  className="-m-1 rounded-md p-2.5 text-neutral-400 hover:bg-red-50 hover:text-red-700"
                >
                  <IconX />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-neutral-500">Add or remove videos, then save once. Nothing changes on the site until you save.</p>
    </div>
  );
}
