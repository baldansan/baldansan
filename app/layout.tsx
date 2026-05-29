import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Бөөндөө Сурцгаая",
    template: "%s | Бөөндөө Сурцгаая",
  },
  description:
    "Богино бичлэг, subtitle, vocabulary, quiz ашиглан Хятад хэл сурах app.",
  openGraph: {
    title: "Бөөндөө Сурцгаая",
    description:
      "Богино бичлэг, subtitle, vocabulary, quiz ашиглан Хятад хэл сурах app.",
    url: siteUrl,
    siteName: "Бөөндөө Сурцгаая",
    locale: "mn_MN",
    type: "website",
  },
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
