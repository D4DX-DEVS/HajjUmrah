import Link from "next/link";
import PostCard from "@/components/PostCard";
import { allCategories, allPosts, allVideos, postsIn } from "@/lib/data";

const sections = ["articles", "fatwa", "rituals", "fiqh", "history-culture"];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allPosts.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
      </section>
      {sections.map((s) => {
        const cat = allCategories.find((c) => c.slug === s)!;
        return (
          <section key={s}>
            <div className="mb-4 flex items-baseline justify-between border-b-2 border-emerald-700 pb-2">
              <h2 className="text-xl font-bold">{cat.name}</h2>
              <Link href={`/${s}`} className="text-sm text-emerald-700 hover:underline">View all</Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {postsIn(s).slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        );
      })}
      <section>
        <div className="mb-4 flex items-baseline justify-between border-b-2 border-emerald-700 pb-2">
          <h2 className="text-xl font-bold">Videos</h2>
          <Link href="/videos" className="text-sm text-emerald-700 hover:underline">View all</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allVideos.map((v) => (
            <Link key={v.slug} href="/videos" className="text-sm font-medium hover:text-emerald-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" className="mb-2 aspect-video w-full rounded-lg object-cover" />
              {v.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
