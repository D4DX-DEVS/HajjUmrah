import Link from "next/link";
import Hero from "@/components/Hero";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import PostRow from "@/components/PostRow";
import SectionHeader from "@/components/SectionHeader";
import YtThumb from "@/components/YtThumb";
import { SITE, allCategories, allPosts, allVideos, decode } from "@/lib/data";

export const metadata = { alternates: { canonical: "/" } };

const sections = ["hajj-umrah", "articles", "fatwa", "rituals", "fiqh", "history-culture"];

export default function Home() {
  const hero = allPosts.slice(0, 3);
  const seen = new Set(hero.map((p) => p.id)); // each post appears once on the page
  return (
    <div className="space-y-16">
      <h1 className="sr-only">Hajj and Umrah</h1>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: "Hajj and Umrah", inLanguage: "ml", publisher: { "@id": SITE + "/#org" } },
        { "@type": "Organization", "@id": SITE + "/#org", name: "islamonlive", url: "https://islamonlive.in" },
      ] }} />
      <Hero posts={hero} />
      {sections.map((s) => {
        const cat = allCategories.find((c) => c.slug === s)!;
        // primary-category posts first, then any other post tagged with this category
        const unseen = allPosts.filter((p) => p.categories.includes(s) && !seen.has(p.id));
        const pool = [...unseen.filter((p) => p.category === s), ...unseen.filter((p) => p.category !== s)];
        const lead = pool.find((p) => p.image) ?? pool[0]; // lead card needs a picture
        if (!lead) return null;
        const rest = pool.filter((p) => p !== lead).slice(0, 3);
        [lead, ...rest].forEach((p) => seen.add(p.id));
        return (
          <section key={s}>
            <SectionHeader title={cat.name} href={`/${s}`} />
            <div className="grid gap-8 lg:grid-cols-5">
              <div className={rest.length ? "lg:col-span-3" : "lg:col-span-5"}><PostCard post={lead} lead wide={!rest.length} /></div>
              {rest.length > 0 && (
                <div className="flex flex-col divide-y divide-hairline lg:col-span-2">
                  {rest.map((p) => <PostRow key={p.id} post={p} />)}
                </div>
              )}
            </div>
          </section>
        );
      })}
      <section>
        <SectionHeader title="Videos" href="/videos" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allVideos.filter((v) => v.youtubeId).slice(0, 4).map((v) => (
            <Link key={v.slug} href="/videos" className="group font-display text-base font-bold leading-snug">
              <YtThumb id={v.youtubeId!} className="mb-3 aspect-video w-full object-cover transition duration-500 group-hover:opacity-90" />
              <span className="sweep line-clamp-2 pb-0.5">{decode(v.title)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
