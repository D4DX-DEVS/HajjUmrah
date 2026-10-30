import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleSidebar, { type Heading } from "@/components/ArticleSidebar";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import SectionHeader from "@/components/SectionHeader";
import ShareLinks from "@/components/ShareLinks";
import { SITE, allPosts, decode, fmtDate, getCategory, getPost, getTag, postHref, postsIn } from "@/lib/data";

export const generateStaticParams = () => allPosts.map((p) => ({ category: p.category, slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) return {};
  return {
    title: decode(post.title),
    description: decode(post.excerpt).slice(0, 160),
    alternates: { canonical: `/${category}/${slug}` },
    openGraph: { type: "article", url: `/${category}/${slug}`, siteName: "Hajj and Umrah", locale: "ml_IN", publishedTime: post.date, authors: [post.author.name], section: getCategory(category)?.name, images: post.image ? [post.image] : [] },
  };
}

export default async function PostPage({ params }: PageProps<"/[category]/[slug]">) {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) notFound();
  const catName = getCategory(category)?.name ?? category;
  const url = SITE + encodeURI(postHref(post));
  // Headings get ids so the sidebar can link to them; the reading time is a plain word count.
  const headings: Heading[] = [];
  const html = post.content.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (m, lvl, attrs, inner) => {
    const text = decode(inner.replace(/<[^>]+>/g, "")).trim();
    if (!text || /\bid=/.test(attrs)) return m;
    const id = `s${headings.length + 1}`;
    headings.push({ id, text });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });
  const minutes = Math.max(1, Math.round(post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 180));
  const more = postsIn(category).filter((p) => p.id !== post.id).slice(4, 8);
  return (
    <>
      <div className="progress" aria-hidden />
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        { "@type": "BlogPosting", "@id": url + "#article", mainEntityOfPage: url, headline: decode(post.title).slice(0, 110), datePublished: post.date, dateModified: post.date, inLanguage: "ml", ...(post.image ? { image: [post.image] } : {}), articleSection: catName,
          author: { "@type": "Person", name: post.author.name, url: SITE + "/author/" + encodeURI(post.author.slug) }, publisher: { "@id": SITE + "/#org" }, isPartOf: { "@id": SITE + "/#website" } },
        { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: catName, item: `${SITE}/${category}` },
          { "@type": "ListItem", position: 3, name: decode(post.title), item: url },
        ] },
      ] }} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="min-w-0">
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link href="/" className="text-neutral-600 hover:text-madinah">Home</Link>
            <span aria-hidden className="mx-2 text-gold">/</span>
            <Link href={`/${category}`} className="font-semibold text-gold-deep hover:underline">{catName}</Link>
          </nav>
          <h1 className="mt-4 font-display text-2xl font-extrabold leading-snug sm:text-4xl">{decode(post.title)}</h1>
          <span className="rule mt-5 block h-0.5 w-20 bg-gold" aria-hidden />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-base font-black text-gold-light">{[...post.author.name][0]}</span>
              <p>
                <Link href={`/author/${post.author.slug}`} className="block font-semibold text-ink hover:text-madinah">{post.author.name}</Link>
                {fmtDate(post.date)} · {minutes} min read
              </p>
            </div>
            <ShareLinks url={url} title={decode(post.title)} />
          </div>
          {post.image && (
            <Image src={post.image} alt="" width={1200} height={750} priority sizes="(min-width:1024px) 700px, 100vw" className="my-8 h-auto w-full" />
          )}
          <div className="wp-content" dangerouslySetInnerHTML={{ __html: html }} />
          {post.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2 text-sm" aria-label="Tags">
              {post.tags.map((s) => (
                <li key={s}>
                  <Link href={`/tag/${s}`} className="border border-gold/50 px-3.5 py-1.5 font-semibold text-gold-deep transition-colors hover:border-gold hover:bg-gold/10">#{getTag(s)?.name ?? s}</Link>
                </li>
              ))}
            </ul>
          )}
        </article>
        <ArticleSidebar post={post} headings={headings} />
      </div>
      {more.length > 0 && (
        <section className="mt-16 border-t border-hairline pt-12">
          <SectionHeader title="More to read" href={`/${category}`} />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
