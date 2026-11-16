import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/lib/config/site";

/* Tipografía: display para títulos, sans para cuerpo.
   Noto Sans JP/KR cubren japonés y coreano; el stack de fallback
   garantiza render correcto en cualquier dispositivo. */
const display = Zen_Kaku_Gothic_New({
  variable: "--font-display",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const body = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const kr = Noto_Sans_KR({
  variable: "--font-kr",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: `${siteConfig.name} — Comida japonesa y coreana`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Descubre los sabores de Asia: Buldak, ramen japonés y coreano, snacks, mochis, pocky y bebidas. Tu antojo asiático comienza aquí.",
  keywords: [
    "buldak",
    "ramen",
    "snacks japoneses",
    "snacks coreanos",
    "pocky",
    "mochi",
    "bebidas coreanas",
    "comida asiática",
    "Perú",
  ],
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Comida japonesa y coreana`,
    description:
      "Descubre los sabores de Asia. Ramen, buldak, snacks, dulces y bebidas de Japón y Corea del Sur.",
    images: [{ url: "/logo.png", width: 1400, height: 1100, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Comida japonesa y coreana`,
    description: "Descubre los sabores de Asia.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFF5E9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${kr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
