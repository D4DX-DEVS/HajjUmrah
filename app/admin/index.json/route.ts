import { decode, getData } from "@/lib/data";

// Slim copy of the site data for the admin (post list, dropdowns, slug checks). Same data the site shows publicly.
export const dynamic = "force-dynamic";

export async function GET() {
  const { allCategories, authors, allTags, allPosts } = await getData();
  return Response.json({
    categories: allCategories.map((c) => ({ slug: c.slug, name: c.name })),
    authors: authors.map((a) => ({ id: a.id, name: a.name, slug: a.slug })),
    tags: allTags.map((t) => ({ slug: t.slug, name: decode(t.name) })),
    posts: allPosts.map((p) => ({ id: p.id, slug: p.slug, title: decode(p.title), category: p.category, date: p.date })),
  }, { headers: { "cache-control": "no-store" } });
}
