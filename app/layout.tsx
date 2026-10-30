import type { Metadata, Viewport } from "next";
import { Noto_Sans_Malayalam, Noto_Serif_Malayalam } from "next/font/google";
import BackToTop from "@/components/BackToTop";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

// every page renders per request from D1 (worker.ts stores the result)
export const dynamic = "force-dynamic";

const font = Noto_Sans_Malayalam({ subsets: ["malayalam", "latin"] });
const display = Noto_Serif_Malayalam({ subsets: ["malayalam", "latin"], weight: ["600", "700", "800", "900"], variable: "--font-serif-ml" });

export const metadata: Metadata = {
  metadataBase: new URL("https://hajj.islamonlive.in"),
  title: { default: "Hajj and Umrah", template: "%s | Hajj and Umrah" },
  description: "Malayalam articles, fatwas, fiqh, history and rituals of Hajj and Umrah from islamonlive.",
  openGraph: { siteName: "Hajj and Umrah", type: "website", locale: "ml_IN" },
  icons: { icon: "/uploads/2022/06/cropped-icon-192x192.png", apple: "/uploads/2022/06/cropped-icon-180x180.png" },
};

export const viewport: Viewport = { themeColor: "#12100d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ml" className={`${font.className} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ihram text-ink">
        <SiteChrome>
          <a href="#main" className="sr-only rounded-lg bg-ink text-sm font-semibold text-gold-light focus:not-sr-only focus:fixed focus:px-4 focus:py-2 focus:left-3 focus:top-3 focus:z-50">Skip to content</a>
          <Header />
        </SiteChrome>
        <main id="main" tabIndex={-1} className="mx-auto outline-none w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        <SiteChrome>
          <Footer />
          <BackToTop />
        </SiteChrome>
      </body>
    </html>
  );
}
