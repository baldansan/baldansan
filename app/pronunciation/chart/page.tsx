import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { PinyinChartView } from "@/components/pronunciation/pinyin-chart";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getPinyinChart } from "@/lib/pronunciation/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "拼音表 — Бөөндөө Сурцгаая",
};

export default async function PinyinChartPage() {
  const [locale, chart] = await Promise.all([getServerUiLocale(), getPinyinChart()]);
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "拼音表", "Пиньинь самбар") }]} />
      <MobilePageHeader
        title={L(locale, "拼音表", "Пиньинь самбар")}
        subtitle={L(locale, "声母 × 韵母，点格子听四声。", "Гийгүүлэгч × эгшиг — нүд дараад 4 аялгуугаар сонс.")}
        badge={`${Object.keys(chart.cells).length}`}
      />
      <PinyinChartView chart={chart} />
    </MobileAppShell>
  );
}
