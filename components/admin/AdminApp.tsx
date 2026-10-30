"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, type Index } from "./api";
import Login from "./Login";
import PostForm from "./PostForm";
import PostsList from "./PostsList";
import VideosView from "./VideosView";
import { IconExternal, IconList, IconLogout, IconPlay, IconPlus, IconX } from "./ui";

type View = { name: "posts" } | { name: "videos" } | { name: "post"; id?: number };
type Toast = { text: string };

export default function AdminApp() {
  const [auth, setAuth] = useState<"checking" | "out" | "in">("checking");
  const [index, setIndex] = useState<Index | null>(null);
  const [view, setView] = useState<View>({ name: "posts" });
  const [toast, setToast] = useState<Toast | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api("session").then(() => setAuth("in")).catch(() => setAuth("out"));
  }, []);

  // the post list reads the live data again each time it is opened
  useEffect(() => {
    if (view.name === "posts") fetch("/admin/index.json", { cache: "no-store" }).then((r) => r.json() as Promise<Index>).then(setIndex).catch(() => {});
  }, [view.name]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  async function logout() {
    await api("logout", { method: "POST" }).catch(() => {});
    setAuth("out");
  }
  const notify = useCallback((text: string) => setToast({ text }), []);
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
  // the page scrolls inside the admin shell, so go back to the top when the screen changes
  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [view.name]);
  const closePost = () => (history.state?.post ? history.back() : setView({ name: "posts" }));

  if (auth === "checking") return <p className="py-20 text-center text-sm text-neutral-500">Loading...</p>;
  if (auth === "out") return <Login onDone={() => setAuth("in")} />;
  if (!index) return <p className="py-20 text-center text-sm text-neutral-500">Loading site data...</p>;

  const item = (on: boolean, label: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={`flex shrink-0 items-center gap-3 rounded-sm border px-3 py-2.5 text-sm font-semibold transition-colors ${on ? "border-gold bg-gold/10 text-gold-deep" : "border-transparent text-neutral-700 hover:bg-sand"}`}
    >
      {icon} {label}
    </button>
  );
  const link = "flex shrink-0 items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-sand";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ihram md:flex-row">
      <aside className="shrink-0 border-b border-hairline bg-white md:flex md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:items-stretch md:gap-1 md:overflow-visible md:p-5">
          <div className="mr-2 shrink-0 md:mb-6 md:mr-0 md:px-1">
            <Image src="/uploads/2022/06/logo-hajj.png" alt="Hajj and Umrah" width={300} height={112} className="h-9 w-auto md:h-12" />
            <p className="mt-1 hidden text-xs font-semibold uppercase tracking-widest text-neutral-500 md:block">Admin</p>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-1 md:flex-col md:items-stretch">
            {item(view.name === "posts" || (view.name === "post" && view.id != null), "Posts", <IconList className="h-5 w-5" />, () => setView({ name: "posts" }))}
            {item(view.name === "videos", "Videos", <IconPlay className="h-5 w-5" />, () => setView({ name: "videos" }))}
            {item(view.name === "post" && view.id == null, "New post", <IconPlus className="h-5 w-5" />, () => openPost())}
            <a href="/" target="_blank" rel="noreferrer" className={link}><IconExternal className="h-5 w-5" /> View site</a>
          </nav>
          <button onClick={logout} className={`${link} ml-auto md:mt-auto`}><IconLogout className="h-5 w-5" /> Log out</button>
        </div>
      </aside>

      <div ref={scroller} id="admin-scroll" className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          {view.name === "posts" && <PostsList index={index} onOpen={openPost} />}
          {view.name === "post" && <PostForm key={view.id ?? "new"} index={index} id={view.id} onBack={closePost} onNotify={notify} onError={guard} />}
          {view.name === "videos" && <VideosView onNotify={notify} onError={guard} />}
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-sm bg-ink px-4 py-3 text-sm text-white shadow-lg ring-1 ring-gold/50">
          <p className="flex-1">
            {toast.text}
                      </p>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-neutral-400 hover:text-white"><IconX /></button>
        </div>
      )}
    </div>
  );
}
