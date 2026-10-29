import Link from "next/link";
import PageTitle from "@/components/PageTitle";

export const metadata = { title: "Privacy & Policy", description: "How hajj.islamonlive.in handles the information you send through the contact form. The site has no accounts, comments, ads or tracking cookies.", alternates: { canonical: "/privacy-policy" } };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl">
      <PageTitle sub="Last updated: October 2026">Privacy Policy</PageTitle>
      <div className="wp-content">
        <p>This site (hajj.islamonlive.in) publishes articles and videos. It has no accounts, no comments and no advertising, and it does not use analytics or tracking cookies.</p>

        <h2>Contact form</h2>
        <p>
          If you use the <Link href="/contact">contact form</Link>, we receive the name, email address and message you type. We use them only to read and reply to your message, and we do not sell or share them for marketing.
        </p>

        <h2>YouTube</h2>
        <p>
          Video thumbnails on the home page are loaded from YouTube (i.ytimg.com), so YouTube can see your IP address and browser details when they load. A video itself only loads from YouTube (youtube-nocookie.com) after you click play, and some articles also embed YouTube videos. YouTube&apos;s own privacy policy applies to what it collects.
        </p>

        <h2>Server logs</h2>
        <p>Our hosting provider may keep standard server logs (IP address, requested page, time) for security and to keep the site running.</p>

        <h2>Links to other sites</h2>
        <p>Some pages link to other sites, including islamonlive.in. We are not responsible for their content or privacy practices.</p>

        <h2>Changes</h2>
        <p>We may update this page; the date above shows the latest version.</p>
      </div>
    </article>
  );
}
