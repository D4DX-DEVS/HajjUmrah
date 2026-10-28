"use client";
import { useEffect, useState } from "react";
import { api, decodeEntities, nowLocal, safeDecode, slugify, toHtml, type Index } from "./api";
import { btn, btnGhost, field } from "./ui";

type Loaded = {
  sha: string;
  post: { title: string; slug: string; category: string; categories: string[]; author: { name: string; slug: string }; date: string; excerpt: string; content: string; image: string | null; tags: string[] };
};
const NEW_AUTHOR = "__new__";

export default function PostForm({ index, id: initialId, onDone, onError }: { index: Index; id?: number; onDone: (msg: string) => void; onError: (e: unknown) => void }) {
  const [id, setId] = useState(initialId);
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(initialId != null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState(index.categories[0]?.slug ?? "");
  const [authorSel, setAuthorSel] = useState(""); // chosen explicitly, never defaulted
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [date, setDate] = useState(nowLocal());
  const [origDate, setOrigDate] = useState(""); // keeps the original seconds when the minute is not edited
  const [extraCats, setExtraCats] = useState<string[]>([]);
  const [tagText, setTagText] = useState("");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState<{ url: string } | null>(null);

  useEffect(() => {
    if (initialId == null) return;
    api<Loaded>(`post?id=${initialId}`)
      .then(({ sha, post: p }) => {
        setSha(sha);
        setTitle(decodeEntities(p.title));
        setSlug(safeDecode(p.slug));
        setCategory(p.category);
        setAuthorSel(index.authors.some((a) => a.slug === p.author.slug) ? p.author.slug : NEW_AUTHOR);
        setNewName(p.author.name);
        setNewSlug(p.author.slug);
        setDate(p.date.slice(0, 16));
        setOrigDate(p.date);
        setExtraCats(p.categories.filter((c) => c !== p.category));
        setTagText(p.tags.map((s) => index.tags.find((t) => t.slug === safeDecode(s))?.name ?? safeDecode(s)).join(", "));
        setImage(p.image ?? "");
        setExcerpt(decodeEntities(p.excerpt));
        setContent(p.content);
        setLoading(false);
      })
      .catch((e) => {
        onError(e);
        setErr((e as Error).message);
        setLoading(false);
      });
  }, [initialId, index, onError]);

  const author = authorSel === NEW_AUTHOR ? { name: newName.trim(), slug: newSlug.trim() } : index.authors.find((a) => a.slug === authorSel);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk(null);
    const tags = tagText.split(",").map((t) => t.trim()).filter(Boolean).map((name) => {
      const k = index.tags.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.slug === name.toLowerCase());
      return k ?? { slug: slugify(name) || name.toLowerCase().replace(/\s+/g, "-"), name };
    });
    try {
      const r = await api<{ id: number; sha: string; commitUrl: string }>("post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, sha: id != null ? sha : undefined, post: { title, slug: slug || slugify(title), category, categories: extraCats.filter((c) => c !== category), author, date: origDate && date === origDate.slice(0, 16) ? origDate : date, excerpt, content: toHtml(content), image: image || null, tags } }),
      });
      setId(r.id);
      setSha(r.sha);
      setOk({ url: r.commitUrl });
      window.scrollTo({ top: 0 });
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  async function remove() {
    if (id == null || !confirm("Delete this post? It is removed from the site after the rebuild (Git history keeps a copy).")) return;
    setBusy(true);
    try {
      await api(`post?id=${id}&sha=${sha}`, { method: "DELETE" });
      onDone("Post deleted. The site updates in about 2-3 minutes.");
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ path: string; url: string }>("upload", { method: "POST", headers: { "x-filename": encodeURIComponent(file.name), "content-type": file.type }, body: file });
      setImage(r.path);
      setPreview(r.url);
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  if (loading) return <p className="text-neutral-500">Loading post...</p>;
  const label = "block text-sm font-medium";
  return (
    <form onSubmit={save} className="space-y-5">
      <h2 className="text-xl font-bold">{id != null ? "Edit post" : "New post"}</h2>
      {ok && (
        <p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">
          Saved to GitHub (<a href={ok.url} target="_blank" rel="noreferrer" className="underline">commit</a>). The site updates in about 2-3 minutes, after the build finishes.
        </p>
      )}
      {err && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{err}</p>}

      <label className={label}>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} className={field} /></label>
      <label className={label}>
        URL part (slug)
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title) || "needed when the title has no English words"} className={field} />
        <span className="text-xs font-normal text-neutral-500">The post lives at /{category}/{slug || slugify(title) || "..."}. Leave it unchanged on existing posts so links keep working.</span>
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
            {index.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className={label}>Date and time<input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className={field} /></label>
      </div>
      {index.categories.length > 1 && (
        <fieldset className="text-sm">
          <legend className="font-medium">Also show in</legend>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            {index.categories.filter((c) => c.slug !== category).map((c) => (
              <label key={c.slug} className="flex items-center gap-2">
                <input type="checkbox" checked={extraCats.includes(c.slug)} onChange={(e) => setExtraCats(e.target.checked ? [...extraCats, c.slug] : extraCats.filter((x) => x !== c.slug))} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className={label}>Author
        <select value={authorSel} onChange={(e) => setAuthorSel(e.target.value)} required className={field}>
          <option value="" disabled>Choose an author...</option>
          {index.authors.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          <option value={NEW_AUTHOR}>New author...</option>
        </select>
      </label>
      {authorSel === NEW_AUTHOR && (
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>New author name<input value={newName} onChange={(e) => setNewName(e.target.value)} required className={field} /></label>
          <label className={label}>Author slug (English, lowercase)<input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="firstname-lastname" className={field} /></label>
        </div>
      )}
      <label className={label}>Tags (comma separated)<input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Hajj, Tawaf" className={field} /></label>

      <div className="space-y-2">
        <label className={label}>Featured image (path or https:// address)<input value={image} onChange={(e) => { setImage(e.target.value); setPreview(""); }} className={field} /></label>
        <label className="inline-block cursor-pointer text-sm text-emerald-700 hover:underline">
          Upload an image (JPEG, PNG, GIF or WebP, up to 4 MB)
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={busy} className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Uploaded preview" className="max-h-40 rounded" />
        )}
      </div>

      <label className={label}>Summary (optional, defaults to the start of the text)<textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={20000} className={field} /></label>
      <label className={label}>
        Body
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={16} className={field + " font-mono text-sm"} />
        <span className="text-xs font-normal text-neutral-500">Plain text: a blank line starts a new paragraph. If you use any HTML tag, write the whole body as HTML (for example &lt;p&gt;...&lt;/p&gt;), because it is then kept exactly as written. Scripts and unsafe markup are removed on save.</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className={btn}>{busy ? "Working..." : id != null ? "Save changes" : "Publish"}</button>
        <button type="button" disabled={busy} onClick={() => onDone("")} className={btnGhost}>Back to list</button>
        {id != null && <button type="button" disabled={busy} onClick={remove} className="ml-auto rounded border border-red-300 px-5 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">Delete</button>}
      </div>
    </form>
  );
}
