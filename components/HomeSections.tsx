import Image from "next/image";
import Link from "next/link";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import PostCard from "@/components/PostCard";
import PostRow from "@/components/PostRow";
import SectionHeader from "@/components/SectionHeader";
import VideoPlayer from "@/components/VideoPlayer";
import YtThumb from "@/components/YtThumb";
import { allCategories, allPosts, allTags, allVideos, decode, fmtDate, postHref, type Post } from "@/lib/data";

// One band per category, alternating light and dark like the reference design. Each shows only real posts.
export const BLURBS: Record<string, string> = {
  "hajj-umrah": "ഹജ്ജും ഉംറയും സംബന്ധിച്ച ലേഖനങ്ങളും മാർഗനിർദേശങ്ങളും",
  articles: "ഹജ്ജ്, ഉംറ, ഇസ്‌ലാമിക ജീവിതം എന്നിവയെക്കുറിച്ചുള്ള ലേഖനങ്ങൾ",
  fatwa: "ഹജ്ജും ഉംറയും സംബന്ധിച്ച ഇസ്‌ലാമിക വിധികൾ",
  rituals: "ഹജ്ജ്, ഉംറ കർമങ്ങൾ ഘട്ടം ഘട്ടമായി",
  fiqh: "ഹജ്ജ്, ഉംറയുമായി ബന്ധപ്പെട്ട ഫിഖ്ഹ് വിശദീകരണങ്ങൾ",
  "history-culture": "ഹജ്ജിന്റെ ചരിത്രം, ഇസ്‌ലാമിക സംസ്കാരം",
  videos: "ഹജ്ജ്, ഉംറ യാത്രയ്ക്കുള്ള വീഡിയോകൾ",
};

const tone = { light: "bg-ihram", sand: "bg-sand", green: "bg-madinah-deep text-white", ink: "bg-ink text-white" };

export function Band({ kind, children }: { kind: keyof typeof tone; children: React.ReactNode }) {
  return (
    <section className={`bleed py-14 ${tone[kind]}`}>
      <div className="mx-auto max-w-6xl px-4">{children}</div>
    </section>
  );
}

function Pic({ post, sizes, className = "" }: { post: Post; sizes: string; className?: string }) {
  return (
    <span className={`${className.includes("absolute") ? "" : "relative"} block overflow-hidden bg-madinah-wash ${className}`}>
      {post.image ? <Image src={post.image} alt="" fill sizes={sizes} className="object-cover transition duration-700 ease-out group-hover:scale-105" /> : <ImagePlaceholder dark={className.includes("absolute")} />}
    </span>
  );
}

const arrow = (
  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold text-gold-light transition-colors group-hover:bg-gold group-hover:text-ink">→</span>
);

// Hajj & Umrah: lead story, a numbered list, and real site counts.
export function HajjUmrah({ posts }: { posts: Post[] }) {
  const [lead, ...rest] = posts;
  const stats: [number, string][] = [[allPosts.length, "Posts"], [allCategories.length, "Categories"], [allTags.length, "Topics"], [allVideos.length, "Videos"]];
  return (
    <Band kind="light">
      <SectionHeader title="Hajj & Umrah" blurb={BLURBS["hajj-umrah"]} href="/hajj-umrah" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3"><PostCard post={lead} lead /></div>
        <ol className="flex flex-col divide-y divide-hairline lg:col-span-2">
          {rest.map((p, i) => (
            <li key={p.id} className={`group relative items-center gap-4 py-4 first:pt-0 ${i >= 2 ? "hidden lg:flex" : "flex"}`}>
              <span aria-hidden className="w-10 shrink-0 font-display text-3xl font-black text-gold-deep/70">{String(i + 1).padStart(2, "0")}</span>
              <Pic post={p} sizes="96px" className="h-16 w-24 shrink-0" />
              <div className="min-w-0">
                <h3 className="line-clamp-2 font-display text-base font-extrabold leading-snug"><Link href={postHref(p)} className="after:absolute after:inset-0"><span className="sweep pb-0.5">{decode(p.title)}</span></Link></h3>
                <p className="mt-1 text-sm text-neutral-600">{fmtDate(p.date)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <dl className="mt-12 grid grid-cols-2 gap-px bg-hairline sm:grid-cols-4">
        {stats.map(([n, l]) => (
          <div key={l} className="bg-sand px-6 py-5 text-center">
            <dd className="font-display text-3xl font-black text-gold-deep">{n}</dd>
            <dt className="mt-1 text-sm text-neutral-600">{l}</dt>
          </div>
        ))}
      </dl>
    </Band>
  );
}

export function Articles({ posts, title, href }: { posts: Post[]; title: string; href: string }) {
  const [lead, ...rest] = posts;
  return (
    <Band kind="sand">
      <SectionHeader title={title} blurb={BLURBS.articles} href={href} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className={rest.length ? "lg:col-span-3" : "lg:col-span-5"}><PostCard post={lead} lead wide={!rest.length} /></div>
        {rest.length > 0 && <div className="flex flex-col divide-y divide-hairline lg:col-span-2">{rest.map((p, i) => <PostRow key={p.id} post={p} className={i >= 2 ? "hidden lg:flex" : "flex"} />)}</div>}
      </div>
    </Band>
  );
}

// Fatwa: dark green, a lead image and a list of questions.
export function Fatwa({ posts, title, href }: { posts: Post[]; title: string; href: string }) {
  const [lead, ...rest] = posts;
  return (
    <Band kind="green">
      <SectionHeader title={title} blurb={BLURBS.fatwa} href={href} dark />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Link href={postHref(lead)} className="group relative block min-h-72 overflow-hidden ring-1 ring-gold/30 lg:col-span-2">
          <Pic post={lead} sizes="(min-width:1024px) 40vw, 100vw" className="absolute inset-0" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 block p-5 font-display text-xl font-extrabold leading-snug text-white"><span className="sweep pb-1">{decode(lead.title)}</span></span>
        </Link>
        <ul className="flex flex-col gap-3 lg:col-span-3">
          {rest.map((p, i) => (
            <li key={p.id} className={`group relative items-center gap-4 border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 ${i >= 3 ? "hidden lg:flex" : "flex"}`}>
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-display text-lg font-black text-ink">?</span>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold leading-snug"><Link href={postHref(p)} className="after:absolute after:inset-0">{decode(p.title)}</Link></h3>
                <p className="mt-0.5 text-sm text-white/65">{fmtDate(p.date)}</p>
              </div>
              {arrow}
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}

// Rituals: a numbered row of steps.
export function Rituals({ posts, title, href }: { posts: Post[]; title: string; href: string }) {
  return (
    <Band kind="light">
      <SectionHeader title={title} blurb={BLURBS.rituals} href={href} />
      <ol className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {posts.map((p, i) => (
          <li key={p.id} className={`group relative ${i >= 4 ? "hidden sm:block" : ""}`}>
            <div className="relative">
              <Pic post={p} sizes="(min-width:1024px) 16vw, 45vw" className="aspect-[4/3]" />
              <span aria-hidden className="absolute -bottom-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-gold-light ring-2 ring-ihram">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-5 line-clamp-2 font-display text-base font-extrabold leading-snug"><Link href={postHref(p)} className="after:absolute after:inset-0"><span className="sweep pb-0.5">{decode(p.title)}</span></Link></h3>
          </li>
        ))}
      </ol>
    </Band>
  );
}

// Fiqh: ink band, a big featured story and a short list.
export function Fiqh({ posts, title, href }: { posts: Post[]; title: string; href: string }) {
  const [lead, ...rest] = posts;
  return (
    <Band kind="ink">
      <SectionHeader title={title} blurb={BLURBS.fiqh} href={href} dark />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Link href={postHref(lead)} className="group relative block min-h-[24rem] overflow-hidden ring-1 ring-gold/30 lg:col-span-3">
          <Pic post={lead} sizes="(min-width:1024px) 60vw, 100vw" className="absolute inset-0 opacity-80" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 block p-6 sm:p-8">
            <span className="block font-display text-2xl font-extrabold leading-tight sm:text-4xl"><span className="sweep pb-1">{decode(lead.title)}</span></span>
            <span className="mt-3 line-clamp-2 block max-w-xl text-white/75">{decode(lead.excerpt)}</span>
            <span className="mt-5 inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-sm font-bold text-ink group-hover:bg-gold-light">Read the story <span aria-hidden>→</span></span>
          </span>
        </Link>
        <ul className="flex flex-col divide-y divide-white/10 lg:col-span-2">
          {rest.map((p, i) => (
            <li key={p.id} className={`group relative items-center gap-4 py-4 first:pt-0 ${i >= 3 ? "hidden lg:flex" : "flex"}`}>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold leading-snug"><Link href={postHref(p)} className="after:absolute after:inset-0">{decode(p.title)}</Link></h3>
                <p className="mt-0.5 text-sm text-white/65">{fmtDate(p.date)}</p>
              </div>
              {arrow}
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}

// History & Culture: a wide lead picture and smaller story tiles.
export function History({ posts, title, href }: { posts: Post[]; title: string; href: string }) {
  const [lead, ...rest] = posts;
  const tile = (p: Post, big?: boolean, hideOnPhone?: boolean) => (
    <Link key={p.id} href={postHref(p)} className={`group relative overflow-hidden bg-ink ${hideOnPhone ? "hidden sm:block" : "block"} ${big ? "min-h-80 sm:col-span-2" : "min-h-56"}`}>
      <Pic post={p} sizes={big ? "(min-width:1024px) 50vw, 100vw" : "(min-width:1024px) 25vw, 50vw"} className="absolute inset-0 opacity-90" />
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      <span className={`absolute inset-x-0 bottom-0 block p-4 font-display font-extrabold leading-snug text-white ${big ? "text-xl sm:text-2xl" : "line-clamp-3 text-base"}`}><span className="sweep pb-0.5">{decode(p.title)}</span></span>
    </Link>
  );
  return (
    <Band kind="sand">
      <SectionHeader title={title} blurb={BLURBS["history-culture"]} href={href} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tile(lead, true)}
        {rest.map((p, i) => tile(p, false, i >= 2))}
      </div>
    </Band>
  );
}

// Videos: a playable lead video and a short list.
export function Videos() {
  const vids = allVideos.filter((v) => v.youtubeId).slice(0, 4);
  const [lead, ...rest] = vids;
  if (!lead) return null;
  return (
    <Band kind="ink">
      <SectionHeader title="Videos" blurb={BLURBS.videos} href="/videos" dark />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VideoPlayer id={lead.youtubeId!} title={decode(lead.title)} />
          <h3 className="mt-4 font-display text-xl font-extrabold">{decode(lead.title)}</h3>
          <p className="mt-1 text-sm text-white/65">{fmtDate(lead.date)}</p>
        </div>
        <ul className="flex flex-col gap-4 lg:col-span-2">
          {rest.map((v, i) => (
            <li key={v.slug} className={`group relative items-center gap-4 ${i >= 2 ? "hidden lg:flex" : "flex"}`}>
              <YtThumb id={v.youtubeId!} className="aspect-video w-32 shrink-0 object-cover" />
              <div className="min-w-0">
                <h3 className="line-clamp-2 font-semibold leading-snug"><Link href={`/video/${v.slug}`} className="after:absolute after:inset-0">{decode(v.title)}</Link></h3>
                <p className="mt-0.5 text-sm text-white/65">{fmtDate(v.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}
