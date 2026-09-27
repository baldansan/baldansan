import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { ToneGame } from "@/components/pronunciation/tone-game";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getCommonSyllableItems } from "@/lib/pronunciation/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "声调听辨 — Бөөндөө Сурцгаая",
};

export default async function ToneGamePage() {
  const [locale, items] = await Promise.all([getServerUiLocale(), getCommonSyllableItems()]);
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "声调听辨", "Аялгуу таних") }]} />
      <MobilePageHeader
        title={L(locale, "声调听辨", "Аялгуу таних")}
        subtitle={L(locale, "HSK 1–2 常用音节，真人录音。", "HSK 1–2 түгээмэл үеүд, хүний дуугаар.")}
        badge={`${items.length}`}
      />
      <ToneGame items={items} />
    </MobileAppShell>
  );
}
