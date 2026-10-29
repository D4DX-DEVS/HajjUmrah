import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import SectionHeader from "@/components/SectionHeader";
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
  const related = postsIn(category).filter((p) => p.id !== post.id).slice(0, 3);
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
      <article className="mx-auto max-w-2xl">
        <nav aria-label="Breadcrumb" className="text-base">
          <Link href="/" className="text-neutral-600 hover:text-madinah">Home</Link>
          <span aria-hidden className="mx-2 text-gold">/</span>
          <Link href={`/${category}`} className="font-semibold text-gold-deep hover:underline">{catName}</Link>
        </nav>
        <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">{decode(post.title)}</h1>
        <span className="rule mt-5 block h-0.5 w-20 bg-gold" aria-hidden />
        <p className="mt-4 text-sm text-neutral-600">
          <Link href={`/author/${post.author.slug}`} className="font-semibold text-ink hover:text-madinah">{post.author.name}</Link> · {fmtDate(post.date)}
        </p>
        {post.image && (
          <Image src={post.image} alt="" width={1200} height={750} priority sizes="(min-width:672px) 672px, 100vw" className="my-8 h-auto w-full" />
        )}
        <div className="wp-content" dangerouslySetInnerHTML={{ __html: post.content }} />
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
      {related.length > 0 && (
        <section className="mt-16 border-t border-hairline pt-12">
          <SectionHeader title="Related" href={`/${category}`} />
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
