import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { DailyToneDrill, type WholeTones } from "@/components/pronunciation/daily-tone-drill";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { WHOLE_SYLLABLES } from "@/lib/pronunciation/daily-tone";
import { getCommonSyllableItems, getPinyinChart, getTonePairs } from "@/lib/pronunciation/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "每日声调 — Бөөндөө Сурцгаая",
};

export default async function DailyTonePage() {
  const [locale, items, pairs, chart] = await Promise.all([getServerUiLocale(), getCommonSyllableItems(), getTonePairs(), getPinyinChart()]);
  const whole: WholeTones = {};
  for (const s of WHOLE_SYLLABLES) {
    const cell = chart.cells[s];
    if (cell) whole[s] = cell.tones;
  }
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "每日声调", "Өдрийн аялгуу") }]} />
      <MobilePageHeader
        title={`🔥 ${L(locale, "每日声调", "Өдрийн аялгуу")}`}
        subtitle={L(locale, "每天 3 分钟：8 个声调 + 6 个双音节 + 4 个整体认读 + 2 个跟读。连续打卡！", "Өдөр бүр 3 минут: 8 аялгуу + 6 хос үг + 4 бүхэл үе + 2 дагаж хэлэх. Streak-ээ тасалдуулахгүй!")}
        badge="20"
      />
      <DailyToneDrill items={items} pairs={pairs} whole={whole} />
    </MobileAppShell>
  );
}
