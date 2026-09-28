import type { Metadata, Viewport } from "next";
import {
  Geist_Mono,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Nunito,
  Zhi_Mang_Xing,
} from "next/font/google";
import { LearnerLanguageGuard } from "@/components/learner-language-guard";
import { AppProviders } from "@/components/providers/app-providers";
import { UiLocaleProvider } from "@/components/i18n/ui-locale-provider";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { PwaServiceWorkerRegister } from "@/components/pwa-service-worker-register";
import "./globals.css";
import "./buunduu-theme.css";
import "@/components/temee/temee-redesign.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Mongolian Cyrillic (Ө, Ү, etc.) — latin-only Geist is not sufficient for mn UI. */
const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Ханз фонт сонголт — Тохиргоо хуудсанд сурагч сонгоно (lib/hanzi-font). */
const notoSerifSc = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

/** Гар бичлэг/самбар дээрх бичлэгтэй төстэй донж (志莽行书). */
const zhiMangXing = Zhi_Mang_Xing({
  variable: "--font-zh-brush",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
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
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1FB85A",
  /** Light-only design — opts the page out of Chrome's auto dark mode. */
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/**
 * Ачаалахад монгол текст анивчихгүй: cookie/localStorage-оор zh бол body-г
 * орчуулагч дуустал нуух (UiTranslator классыг арилгана; 3с-ийн хамгаалалттай).
 */
const PENDING_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\s*)buunduu-ui-locale=(zh|mn)/);var l=m?m[1]:(localStorage.getItem('buunduu-ui-locale-v1')||'zh');if(l==='zh'){document.documentElement.classList.add('ui-zh-pending');setTimeout(function(){document.documentElement.classList.remove('ui-zh-pending')},3000)}}catch(e){}})()`;

/**
 * Ханзны фонтын сонголт (Тохиргоо: Энгийн/Сурах бичиг/Самбар) — localStorage-оос
 * унших ба CSS-ийн зурагдахаас (flash) өмнө html дээр data-hanzi-font тавина.
 */
const HANZI_FONT_SCRIPT = `(function(){try{var f=localStorage.getItem('buunduu-hanzi-font-v1');if(f==='serif'||f==='brush'){document.documentElement.setAttribute('data-hanzi-font',f)}}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerUiLocale();
  return (
    <html
      lang={locale === "zh" ? "zh-CN" : "mn"}
      className={`${nunito.variable} ${notoSansSc.variable} ${notoSerifSc.variable} ${zhiMangXing.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PENDING_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: HANZI_FONT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <UiLocaleProvider locale={locale}>
          <AppProviders>
            <LearnerLanguageGuard />
            {children}
            <PwaServiceWorkerRegister />
          </AppProviders>
        </UiLocaleProvider>
      </body>
    </html>
  );
}
