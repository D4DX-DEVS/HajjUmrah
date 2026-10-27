"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api, type Index } from "./api";
import PostForm from "./PostForm";
import VideosView from "./VideosView";
import { btn, field } from "./ui";

type View = { name: "posts" } | { name: "videos" } | { name: "post"; id?: number };

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
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
    }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Admin login</h1>
      <label className="block text-sm font-medium">
        Password
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required autoFocus className={field} />
      </label>
      <button disabled={busy} className={btn}>{busy ? "Checking..." : "Log in"}</button>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    </form>
  );
}

export default function AdminApp() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [index, setIndex] = useState<Index | null>(null);
  const [view, setView] = useState<View>({ name: "posts" });
  const [flash, setFlash] = useState("");

  useEffect(() => {
    api("session").then(() => setAuth("in")).catch(() => setAuth("out"));
    fetch("/admin/index.json").then((r) => r.json()).then(setIndex).catch(() => {});
  }, []);

  async function logout() {
    await api("logout", { method: "POST" }).catch(() => {});
    setAuth("out");
  }
  const go = (v: View, msg = "") => {
    setView(v);
    setFlash(msg);
  };
  // any request that comes back 401 sends the user to the login screen
  const guard = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) setAuth("out");
  }, []);

  if (auth === "checking") return <p className="text-neutral-500">Loading...</p>;
  if (auth === "out") return <Login onDone={() => { setAuth("in"); setFlash(""); }} />;
  if (!index) return <p className="text-neutral-500">Loading site data...</p>;

  const tab = (name: "posts" | "videos", label: string) => (
    <button onClick={() => go({ name })} className={`rounded-full px-4 py-1.5 text-sm font-medium ${view.name === name ? "bg-emerald-700 text-white" : "hover:bg-emerald-50"}`}>{label}</button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-3">
        <h1 className="mr-4 text-xl font-bold">Admin</h1>
        {tab("posts", "Posts")}
        {tab("videos", "Videos")}
        <button onClick={logout} className="ml-auto text-sm text-neutral-600 hover:text-emerald-700">Log out</button>
      </div>
      {flash && <p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-900">{flash}</p>}
      {view.name === "posts" && <PostsList index={index} onOpen={(id) => go({ name: "post", id })} />}
      {view.name === "post" && <PostForm key={view.id ?? "new"} index={index} id={view.id} onDone={(m) => go({ name: "posts" }, m)} onError={guard} />}
      {view.name === "videos" && <VideosView onError={guard} />}
    </div>
  );
}

function PostsList({ index, onOpen }: { index: Index; onOpen: (id?: number) => void }) {
  const [q, setQ] = useState("");
  const rows = index.posts.filter((p) => (p.title + " " + p.slug).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 100);
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug" aria-label="Search posts" className={field} />
        <button onClick={() => onOpen()} className={btn + " whitespace-nowrap"}>New post</button>
      </div>
      <p className="text-xs text-neutral-500">Shows the last published version of the site ({index.posts.length} posts). A change you just saved appears here after the rebuild finishes.</p>
      <ul className="divide-y divide-black/5 rounded border border-black/10 bg-white">
        {rows.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.title}</p>
              <p className="text-xs text-neutral-500">{p.category} · {p.date.slice(0, 10)} · /{p.slug}</p>
            </div>
            <button onClick={() => onOpen(p.id)} className="text-sm text-emerald-700 hover:underline">Edit</button>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-sm text-neutral-500">No posts match.</li>}
      </ul>
      {index.posts.length > 100 && !q && <p className="text-xs text-neutral-500">Showing 100 of {index.posts.length}. Use the search to find others.</p>}
    </div>
  );
}
