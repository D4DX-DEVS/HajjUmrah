import type { Metadata } from "next";
import { Noto_Sans_Malayalam } from "next/font/google";
import BackToTop from "@/components/BackToTop";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const font = Noto_Sans_Malayalam({ subsets: ["malayalam", "latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hajj.islamonlive.in"),
  title: { default: "Hajj and Umrah", template: "%s | Hajj and Umrah" },
  description: "Hajj and Umrah articles, fatwas, fiqh, history and rituals.",
  icons: { icon: "/uploads/2022/06/cropped-icon-192x192.png", apple: "/uploads/2022/06/cropped-icon-180x180.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ml" className={`${font.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-stone-50 text-neutral-900">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
