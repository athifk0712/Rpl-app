import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SupplierHub — Platform Supplier UMKM Indonesia",
  description: "Temukan, bandingkan, dan hubungi supplier bahan baku terpercaya untuk UMKM Indonesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-screen flex flex-col bg-canvas text-ink">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary"
        >
          Langsung ke konten
        </a>
        <Header />
        <main id="konten" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
