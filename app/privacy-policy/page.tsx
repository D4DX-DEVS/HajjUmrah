import PageTitle from "@/components/PageTitle";
import { getPage } from "@/lib/data";

export const metadata = { title: "Privacy & Policy" };

export default function Privacy() {
  const page = getPage("privacy-policy")!;
  return (
    <article className="mx-auto max-w-2xl">
      <PageTitle>{page.title}</PageTitle>
      <div className="wp-content" dangerouslySetInnerHTML={{ __html: page.content }} />
    </article>
  );
}
