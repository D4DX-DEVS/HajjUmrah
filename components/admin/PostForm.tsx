"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, decodeEntities, nowLocal, plainToHtml, safeDecode, slugify, type Index } from "./api";
import BodyEditor, { type Mode } from "./BodyEditor";
import ImageField from "./ImageField";
import TagInput from "./TagInput";
import { Card, Field, IconBack, Notice, btnDanger, btnPrimary, input } from "./ui";

type Loaded = {
  sha: string;
  post: { title: string; slug: string; category: string; categories: string[]; author: { name: string; slug: string }; date: string; excerpt: string; content: string; image: string | null; tags: string[] };
};
type Form = {
  title: string;
  slug: string;
  category: string;
  extraCats: string[];
  authorSel: string; // an author slug, "" (not chosen) or NEW_AUTHOR
  newName: string;
  newSlug: string;
  date: string;
  tags: string[];
  image: string;
  excerpt: string;
  content: string;
  mode: Mode;
};
const NEW_AUTHOR = "__new__";

export default function PostForm({ index, id: initialId, onBack, onNotify, onError }: { index: Index; id?: number; onBack: () => void; onNotify: (text: string, href?: string) => void; onError: (e: unknown) => void }) {
  const blank: Form = { title: "", slug: "", category: index.categories[0]?.slug ?? "", extraCats: [], authorSel: "", newName: "", newSlug: "", date: nowLocal(), tags: [], image: "", excerpt: "", content: "", mode: "text" };
  const [f, setF] = useState<Form>(blank);
  const [baseline, setBaseline] = useState(() => JSON.stringify(blank));
  const [id, setId] = useState(initialId);
  const [sha, setSha] = useState("");
  const [origDate, setOrigDate] = useState(""); // keeps the original seconds when the minute is not edited
  const [loading, setLoading] = useState(initialId != null);
  const [slugOpen, setSlugOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));

  useEffect(() => {
    if (initialId == null) return;
    api<Loaded>(`post?id=${initialId}`)
      .then(({ sha, post: p }) => {
        const known = index.authors.some((a) => a.slug === p.author.slug);
        const loaded: Form = {
          title: decodeEntities(p.title),
          slug: safeDecode(p.slug),
          category: p.category,
          extraCats: p.categories.filter((c) => c !== p.category),
          authorSel: known ? p.author.slug : NEW_AUTHOR,
          newName: p.author.name,
          newSlug: p.author.slug,
          date: p.date.slice(0, 16),
          tags: p.tags.map((s) => index.tags.find((t) => t.slug === safeDecode(s))?.name ?? safeDecode(s)),
          image: p.image ?? "",
          excerpt: decodeEntities(p.excerpt),
          content: p.content,
          mode: "html", // imported posts are HTML
        };
        setF(loaded);
        setBaseline(JSON.stringify(loaded));
        setSha(sha);
        setOrigDate(p.date);
        setLoading(false);
      })
      .catch((e) => {
        onError(e);
        setErr((e as Error).message);
        setLoading(false);
      });
  }, [initialId, index, onError]);

  const dirty = JSON.stringify(f) !== baseline;
  const author = f.authorSel === NEW_AUTHOR ? { name: f.newName.trim(), slug: f.newSlug.trim() } : index.authors.find((a) => a.slug === f.authorSel);
  const authorOk = !!author?.name && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(author.slug);
  const finalSlug = f.slug.trim() || slugify(f.title);
  const missing = [!f.title.trim() && "a title", !f.content.trim() && "the post text", !authorOk && "an author", !finalSlug && "a URL (English letters)"].filter(Boolean) as string[];

  async function save() {
    if (busy || missing.length) return;
    setBusy(true);
    setErr("");
    const tags = f.tags.map((name) => {
      const k = index.tags.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.slug === name.toLowerCase());
      return k ?? { slug: slugify(name) || name.toLowerCase().replace(/\s+/g, "-"), name };
    });
    try {
      const r = await api<{ id: number; sha: string }>("post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          sha: id != null ? sha : undefined,
          post: {
            title: f.title,
            slug: finalSlug,
            category: f.category,
            categories: f.extraCats.filter((c) => c !== f.category),
            author,
            date: origDate && f.date === origDate.slice(0, 16) ? origDate : f.date,
            excerpt: f.excerpt,
            content: f.mode === "html" ? f.content.trim() : plainToHtml(f.content),
            image: f.image || null,
            tags,
          },
        }),
      });
      setId(r.id);
      setSha(r.sha);
      // lock in the URL that was just published, so a later edit of the title does not rename it
      const saved = { ...f, slug: finalSlug };
      setF(saved);
      setBaseline(JSON.stringify(saved));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      onNotify(id != null ? "Changes saved. They are live on the site now." : "Post published. It is live on the site now.");
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
      document.getElementById("admin-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
    }
    setBusy(false);
  }

  // keep the latest save for the keyboard shortcut
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const back = useCallback(() => {
    if (!dirty || confirm("Leave without saving? Your changes will be lost.")) onBack();
  }, [dirty, onBack]);

  async function remove() {
    if (id == null || !confirm("Delete this post? It disappears from the site at once and cannot be restored.")) return;
    setBusy(true);
    try {
      await api(`post?id=${id}&sha=${sha}`, { method: "DELETE" });
      onNotify("Post deleted.");
      onBack();
    } catch (x) {
      onError(x);
      setErr((x as Error).message);
      setBusy(false);
    }
  }

  if (loading) return <p className="py-20 text-center text-sm text-neutral-500">Loading post...</p>;
  const status = busy ? "Saving..." : dirty ? "Unsaved changes" : savedAt ? `Saved at ${savedAt}` : "";
  const showSlug = slugOpen || (!slugify(f.title) && !f.slug.trim());

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 -mt-6 border-b border-hairline bg-ihram/90 px-4 py-2.5 sm:-mx-8 sm:-mt-8 sm:px-8 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button type="button" onClick={back} className="inline-flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
            <IconBack /> Posts
          </button>
          <span className="hidden text-sm text-neutral-400 sm:inline">{id != null ? "Editing post" : "New post"}</span>
          <div className="ml-auto flex items-center gap-3">
            <span aria-live="polite" className={`text-xs ${dirty ? "text-amber-700" : "text-neutral-500"}`}>{status}</span>
            <button type="button" onClick={save} disabled={busy || missing.length > 0} className={btnPrimary} title="Ctrl+S">
              {id != null ? "Save changes" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          {err && <Notice kind="error">{err}</Notice>}
          {dirty && missing.length > 0 && <p className="text-sm text-amber-700">Still needed to save: {missing.join(", ")}.</p>}

          <textarea
            value={f.title}
            onChange={(e) => set({ title: e.target.value.replace(/\n/g, " ") })}
            aria-label="Title"
            placeholder="Post title"
            maxLength={300}
            rows={1}
            autoFocus={id == null}
            className="block w-full resize-none border-0 border-b-2 border-hairline bg-transparent px-0 py-2 font-display text-3xl font-black leading-snug [field-sizing:content] placeholder:text-neutral-300 focus:border-gold focus:outline-none"
          />

          <div className="text-sm text-neutral-500">
            {showSlug ? (
              <div className="space-y-1">
                <label className="block font-medium text-neutral-700" htmlFor="slug">URL</label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0">/{f.category}/</span>
                  <input id="slug" value={f.slug} onChange={(e) => set({ slug: e.target.value })} placeholder={slugify(f.title) || "english-words-for-the-link"} className={`${input} py-1.5`} />
                </div>
                {id != null && <p className="text-xs text-amber-700">Changing the URL of a published post breaks links people already have.</p>}
              </div>
            ) : (
              <p>
                <span className="break-all">/{f.category}/{finalSlug || "..."}</span>{" "}
                <button type="button" onClick={() => setSlugOpen(true)} className="-my-2 px-2 py-3 font-medium text-madinah hover:underline">Edit</button>
              </p>
            )}
          </div>

          <BodyEditor value={f.content} mode={f.mode} onChange={(content) => set({ content })} onMode={(mode, content) => set({ mode, content })} />
        </div>

        <aside className="space-y-4">
          <Card title="Publish">
            <Field label="Date and time">
              <input type="datetime-local" value={f.date} onChange={(e) => set({ date: e.target.value })} required className={input} />
            </Field>
          </Card>

          <Card title="Organise">
            <Field label="Category">
              <select value={f.category} onChange={(e) => set({ category: e.target.value })} className={input}>
                {index.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <details className="text-sm" open={f.extraCats.length > 0}>
              <summary className="cursor-pointer py-2 text-neutral-500 hover:text-neutral-800">Also show in other categories{f.extraCats.length ? ` (${f.extraCats.length})` : ""}</summary>
              <div className="mt-2 space-y-1.5">
                {index.categories.filter((c) => c.slug !== f.category).map((c) => (
                  <label key={c.slug} className="flex items-center gap-3 py-1.5">
                    <input type="checkbox" checked={f.extraCats.includes(c.slug)} onChange={(e) => set({ extraCats: e.target.checked ? [...f.extraCats, c.slug] : f.extraCats.filter((x) => x !== c.slug) })} className="h-5 w-5 accent-madinah" />
                    {c.name}
                  </label>
                ))}
              </div>
            </details>
            <Field label="Author">
              <select value={f.authorSel} onChange={(e) => set({ authorSel: e.target.value })} className={input}>
                <option value="" disabled>Choose an author...</option>
                {index.authors.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                <option value={NEW_AUTHOR}>+ Add a new author</option>
              </select>
            </Field>
            {f.authorSel === NEW_AUTHOR && (
              <div className="space-y-3 rounded-sm bg-neutral-50 p-3">
                <Field label="Author name"><input value={f.newName} onChange={(e) => set({ newName: e.target.value })} className={input} /></Field>
                <Field label="Author URL" hint="English lowercase letters, numbers and dashes, e.g. first-last">
                  <input value={f.newSlug} onChange={(e) => set({ newSlug: e.target.value.toLowerCase() })} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={input} />
                </Field>
              </div>
            )}
            <Field label="Tags">
              <TagInput value={f.tags} onChange={(tags) => set({ tags })} suggestions={index.tags.map((t) => t.name)} />
            </Field>
          </Card>

          <Card title="Featured image">
            <ImageField value={f.image} onChange={(image) => set({ image })} onError={onError} />
          </Card>

          <Card title="Summary">
            <details className="text-sm" open={!!f.excerpt}>
              <summary className="cursor-pointer py-2 text-neutral-500 hover:text-neutral-800">Write a short summary (optional)</summary>
              <textarea value={f.excerpt} onChange={(e) => set({ excerpt: e.target.value })} rows={4} maxLength={20000} aria-label="Summary" className={`${input} mt-2`} />
              <p className="mt-1 text-xs text-neutral-500">Shown on cards and in search. Defaults to the start of the text.</p>
            </details>
          </Card>

          {id != null && (
            <Card title="Danger zone">
              <button type="button" onClick={remove} disabled={busy} className={`${btnDanger} w-full`}>Delete this post</button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
