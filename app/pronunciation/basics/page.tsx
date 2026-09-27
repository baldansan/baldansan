import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { PinyinCourseMap } from "@/components/pronunciation/pinyin-course-map";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { PINYIN_COURSE } from "@/lib/pronunciation/pinyin-course";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "拼音基础 — Бөөндөө Сурцгаая",
};

export default async function PinyinBasicsPage() {
  const locale = await getServerUiLocale();
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/pronunciation", label: L(locale, "发音", "Дуудлага") }, { label: L(locale, "拼音基础", "Пиньинь суурь") }]} />
      <MobilePageHeader
        title={L(locale, "拼音基础", "Пиньинь суурь")}
        subtitle={L(
          locale,
          "像中国一年级小朋友一样学拼音：a o e → b p m f → 复韵母 → 鼻韵母 → 整体认读 → 规则。",
          "Хятадын 1-р ангийн хүүхэд шиг: a o e → бо по мо фо → давхар эгшиг → хамрын эгшиг → бүхэл үе → дүрэм.",
        )}
        badge={`${PINYIN_COURSE.length}`}
      />
      <PinyinCourseMap />
    </MobileAppShell>
  );
}
