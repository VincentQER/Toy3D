import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartContext";
import { AuthProvider } from "@/components/AuthContext";
import { LocaleProvider } from "@/lib/locale";
import { Footer } from "@/components/Footer";
import { SkipToMain } from "@/components/SkipToMain";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PrintFig | 3D printed figures & collectibles",
    template: "%s | PrintFig",
  },
  description:
    "High-quality 3D printed action figures and statues — Marvel, DC, Sonic and more. Pre-order and in-stock collectibles, US shipping.",
  openGraph: {
    type: "website",
    siteName: "PrintFig",
    locale: "en_US",
    url: siteUrl,
    title: "PrintFig | 3D printed figures & collectibles",
    description:
      "High-quality 3D printed action figures and statues. Pre-order and in-stock collectibles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PrintFig | 3D printed figures & collectibles",
    description:
      "High-quality 3D printed action figures and statues. Pre-order and in-stock collectibles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <LocaleProvider>
          <SkipToMain />
          <AuthProvider>
            <CartProvider>
              <Header />
              <main id="main-content" className="flex-1" tabIndex={-1}>
                {children}
              </main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
