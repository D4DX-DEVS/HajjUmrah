import PageTitle from "@/components/PageTitle";

export const metadata = { title: "About" };

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
