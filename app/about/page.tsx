import PageTitle from "@/components/PageTitle";

export const metadata = { title: "About", description: "About Hajj and Umrah, a Malayalam-language resource from islamonlive with articles, fatwas, fiqh, history and videos on Hajj and Umrah.", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <article className="mx-auto max-w-2xl">
      <PageTitle>About</PageTitle>
      <div className="wp-content">
        <p>Hajj and Umrah is a Malayalam-language knowledge resource from islamonlive.in. It brings together articles, fatwas, fiqh rulings, history and culture, rituals and videos on Hajj and Umrah.</p>
        <p>Our aim is to help pilgrims and readers understand the rites, their meaning and their history, drawing on established scholarship.</p>
      </div>
    </article>
  );
}
