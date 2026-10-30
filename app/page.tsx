import Hero from "@/components/Hero";
import { Articles, Fatwa, Fiqh, HajjUmrah, History, Rituals, Videos } from "@/components/HomeSections";
import JsonLd from "@/components/JsonLd";
import { SITE, allCategories, allPosts, type Post } from "@/lib/data";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const hero = allPosts.slice(0, 3);
  const seen = new Set(hero.map((p) => p.id)); // each post appears once on the page
  // primary-category posts first, then any other post tagged with the category; `pic` wants the lead to have a picture
  const pick = (slug: string, n: number, pic = true): Post[] => {
    const unseen = allPosts.filter((p) => p.categories.includes(slug) && !seen.has(p.id));
    const pool = [...unseen.filter((p) => p.category === slug), ...unseen.filter((p) => p.category !== slug)];
    const lead = pic ? pool.find((p) => p.image) ?? pool[0] : pool[0];
    const out = lead ? [lead, ...pool.filter((p) => p !== lead).slice(0, n - 1)] : [];
    out.forEach((p) => seen.add(p.id));
    return out;
  };
  const name = (s: string) => allCategories.find((c) => c.slug === s)?.name ?? s;
  const hu = pick("hajj-umrah", 4), ar = pick("articles", 4), fa = pick("fatwa", 5), ri = pick("rituals", 6, false), fi = pick("fiqh", 5), hi = pick("history-culture", 4);
  return (
    <div className="-mb-[6.5rem] sm:-mb-[7.5rem]">
      <h1 className="sr-only">Hajj and Umrah</h1>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: "Hajj and Umrah", inLanguage: "ml", publisher: { "@id": SITE + "/#org" } },
        { "@type": "Organization", "@id": SITE + "/#org", name: "islamonlive", url: "https://islamonlive.in" },
      ] }} />
      <Hero posts={hero} />
      {hu.length > 0 && <HajjUmrah posts={hu} />}
      {ar.length > 0 && <Articles posts={ar} title={name("articles")} href="/articles" />}
      {fa.length > 0 && <Fatwa posts={fa} title={name("fatwa")} href="/fatwa" />}
      {ri.length > 0 && <Rituals posts={ri} title={name("rituals")} href="/rituals" />}
      {fi.length > 0 && <Fiqh posts={fi} title={name("fiqh")} href="/fiqh" />}
      {hi.length > 0 && <History posts={hi} title={name("history-culture")} href="/history-culture" />}
      <Videos />
    </div>
  );
}
