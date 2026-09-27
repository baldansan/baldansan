import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { PinyinErrorsUnit } from "@/components/pronunciation/pinyin-errors-unit";
import { PinyinUnit, type UnitTones } from "@/components/pronunciation/pinyin-unit";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getPinyinChart } from "@/lib/pronunciation/data";
import { PINYIN_COURSE, getCourseUnit, nextCourseUnit, unitSyllableKeys } from "@/lib/pronunciation/pinyin-course";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ unit: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { unit: id } = await params;
  const unit = getCourseUnit(id);
  return { title: `${unit ? `${unit.titleZh} · ${unit.title}` : "拼音基础"} — Бөөндөө Сурцгаая` };
}

export default async function PinyinUnitPage({ params }: PageProps) {
  const { unit: id } = await params;
  const unit = getCourseUnit(id);
  if (!unit) notFound();
  const [locale, chart] = await Promise.all([getServerUiLocale(), getPinyinChart()]);

  // Зөвхөн энэ нэгжид хэрэгтэй нүднүүдийн аудио
  const tones: UnitTones = {};
  for (const key of unitSyllableKeys(unit)) {
    const cell = chart.cells[key];
    if (cell) tones[key] = cell.tones;
  }
  const next = nextCourseUnit(unit.id);
  const title = L(locale, unit.titleZh, unit.title);

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/pronunciation", label: L(locale, "发音", "Дуудлага") },
          { href: "/pronunciation/basics", label: L(locale, "拼音基础", "Пиньинь суурь") },
          { label: `${unit.order}. ${title}` },
        ]}
      />
      <MobilePageHeader
        title={`${unit.emoji} ${title}`}
        subtitle={locale !== "zh" && unit.title !== unit.titleZh ? unit.titleZh : undefined}
        badge={unit.kind === "errors" ? "🇲🇳" : `${unit.order}/${PINYIN_COURSE.length}`}
      />
      {unit.kind === "errors" ? (
        <PinyinErrorsUnit unit={unit} tones={tones} />
      ) : (
        <PinyinUnit unit={unit} tones={tones} next={next ? { id: next.id, title: next.title, titleZh: next.titleZh } : null} />
      )}
    </MobileAppShell>
  );
}
