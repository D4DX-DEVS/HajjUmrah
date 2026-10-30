"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiError, api, type Index } from "./api";
import Login from "./Login";
import PostForm from "./PostForm";
import PostsList from "./PostsList";
import VideosView from "./VideosView";
import { IconExternal, IconX } from "./ui";

type View = { name: "posts" } | { name: "videos" } | { name: "post"; id?: number };
type Toast = { text: string; href?: string };

export default function AdminApp() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [index, setIndex] = useState<Index | null>(null);
  const [view, setView] = useState<View>({ name: "posts" });
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    api("session").then(() => setAuth("in")).catch(() => setAuth("out"));
    fetch("/admin/index.json").then((r) => r.json()).then(setIndex).catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  async function logout() {
    await api("logout", { method: "POST" }).catch(() => {});
    setAuth("out");
  }
  const notify = useCallback((text: string, href?: string) => setToast({ text, href }), []);
  // any request that comes back 401 sends the user to the login screen
  const guard = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) setAuth("out");
  }, []);

  // the browser Back button leaves an opened post the same way the Back link does
  useEffect(() => {
    const onPop = () => setView({ name: "posts" });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const openPost = (id?: number) => {
    history.pushState({ post: true }, "");
    setView({ name: "post", id });
  };
  const closePost = () => (history.state?.post ? history.back() : setView({ name: "posts" }));

  if (auth === "checking") return <p className="py-20 text-center text-sm text-neutral-500">Loading...</p>;
  if (auth === "out") return <Login onDone={() => setAuth("in")} />;
  if (!index) return <p className="py-20 text-center text-sm text-neutral-500">Loading site data...</p>;

  const tab = (name: "posts" | "videos", label: string) => {
    const on = view.name === name || (name === "posts" && view.name === "post");
    return (
      <button
        onClick={() => setView(name === "posts" ? { name: "posts" } : { name: "videos" })}
        aria-current={on ? "page" : undefined}
        className={`relative px-3 py-2 text-sm font-semibold transition-colors ${on ? "text-gold-light after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-gold" : "text-white/70 hover:text-white"}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <header className="sticky top-0 z-30 -mx-4 -mt-6 bg-ink shadow-[0_1px_0_0_var(--color-gold)] sm:-mt-10">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <span className="mr-3 font-display text-lg font-black text-gold-light">Admin</span>
          <nav aria-label="Admin" className="flex gap-1">{tab("posts", "Posts")}{tab("videos", "Videos")}</nav>
          <div className="ml-auto flex items-center gap-4">
            <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-sm font-semibold text-white/70 hover:text-white sm:inline-flex">View site <IconExternal /></a>
            <button onClick={logout} className="-my-2 py-3 text-sm font-semibold text-white/70 hover:text-gold-light">Log out</button>
          </div>
        </div>
      </header>

      <div className="pt-6">
        {view.name === "posts" && <PostsList index={index} onOpen={openPost} />}
        {view.name === "post" && <PostForm key={view.id ?? "new"} index={index} id={view.id} onBack={closePost} onNotify={notify} onError={guard} />}
        {view.name === "videos" && <VideosView onNotify={notify} onError={guard} />}
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-sm bg-ink px-4 py-3 text-sm text-white shadow-lg ring-1 ring-gold/50">
          <p className="flex-1">
            {toast.text}
            {toast.href && <> <a href={toast.href} target="_blank" rel="noreferrer" className="font-medium text-gold-light underline">View commit</a></>}
          </p>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-neutral-400 hover:text-white"><IconX /></button>
        </div>
      )}
    </div>
  );
}
