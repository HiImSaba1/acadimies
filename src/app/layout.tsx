import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { RouteFocusManager } from "@/components/motion/RouteFocusManager";
import { CookieNotice } from "@/components/editorial/CookieNotice";
import { BackToTopButton } from "@/components/editorial/BackToTopButton";
import "./globals.css";
import "yet-another-react-lightbox/styles.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://acadimies.gr"),
  title: { default: "Ακαδημίες — Το παιχνίδι ξεκινά εδώ", template: "%s | Ακαδημίες" },
  description: "Νέα και άρθρα για ακαδημίες ποδοσφαίρου, γονείς, προπονητές και την ψυχολογία των παιδιών.",
  alternates: { types: { "application/rss+xml": "https://acadimies.gr/feed.xml" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="el" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main-content">Μετάβαση στο κύριο περιεχόμενο</a>
        <SmoothScrollProvider><RouteFocusManager />{children}</SmoothScrollProvider>
        <BackToTopButton />
        <CookieNotice />
      </body>
    </html>
  );
}
