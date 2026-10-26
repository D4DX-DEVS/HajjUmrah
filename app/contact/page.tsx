import ContactForm from "@/components/ContactForm";
import PageTitle from "@/components/PageTitle";

export const metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle sub="Questions, corrections or feedback? Send us a message.">Contact</PageTitle>
      <ContactForm />
    </div>
  );
}
