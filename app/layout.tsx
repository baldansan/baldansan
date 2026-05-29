import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaServiceWorkerRegister } from "@/components/pwa-service-worker-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://baldansan.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Бөөндөө Сурцгаая",
  title: {
    default: "Бөөндөө Сурцгаая — Хятад хэл сурах апп",
    template: "%s | Бөөндөө Сурцгаая",
  },
  description:
    "Богино бичлэг, subtitle, vocabulary, quiz ашиглан Хятад хэлийг өдөр бүр бага багаар сур.",
  keywords: [
    "Хятад хэл",
    "HSK",
    "subtitle",
    "vocabulary",
    "quiz",
    "Mongolian Chinese learning",
    "Бөөндөө Сурцгаая",
  ],
  authors: [{ name: "Buunduu Surtsgaay" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Сурцгаая",
  },
  openGraph: {
    title: "Бөөндөө Сурцгаая — Хятад хэл сурах апп",
    description:
      "Богино бичлэг, subtitle, vocabulary, quiz ашиглан Хятад хэлийг өдөр бүр бага багаар сур.",
    url: siteUrl,
    siteName: "Бөөндөө Сурцгаая",
    locale: "mn_MN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Бөөндөө Сурцгаая",
    description:
      "Богино бичлэг, subtitle, vocabulary, quiz ашиглан Хятад хэл сур.",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PwaServiceWorkerRegister />
      </body>
    </html>
  );
}
