import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact" };

export default function Contact() {
  return (
    <article className="mx-auto max-w-xl">
      <h1 className="mb-2 text-3xl font-bold">Contact</h1>
      <p className="mb-6 text-neutral-600">Questions, corrections or feedback? Send us a message.</p>
      <ContactForm />
    </article>
  );
}
