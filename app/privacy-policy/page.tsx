import { getPage } from "@/lib/data";

export const metadata = { title: "Privacy & Policy" };

export default function Privacy() {
  const page = getPage("privacy-policy")!;
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
      <div className="wp-content" dangerouslySetInnerHTML={{ __html: page.content }} />
    </article>
  );
}
