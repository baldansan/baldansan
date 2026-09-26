import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { SourceLessonLearnerView } from "@/components/books/source-lesson-learner-view";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { HSK_LEVEL_META, isHskLevelId } from "@/lib/books/catalog";
import { fetchPublicSourceLesson, fetchPublicSourceLessonsByLevel } from "@/lib/books/source-public";
import { getServerUiLocale } from "@/lib/i18n/server-locale";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ level: string; lesson: string }> };

function sourceId(level: string, lesson: number) {
  return `${level}-l${String(lesson).padStart(2, "0")}`;
}

export async function generateMetadata({ params }: Props) {
  const { level, lesson } = await params;
  return { title: `HSK标准教程 ${level.toUpperCase()} 第${lesson}课 — Бөөндөө Сурцгаая` };
}

export default async function HskSourceLessonPage({ params }: Props) {
  const { level, lesson } = await params;
  const n = Number(lesson);
  if (!isHskLevelId(level) || !Number.isInteger(n) || n < 1) notFound();
  const [locale, result, siblings] = await Promise.all([
    getServerUiLocale(),
    fetchPublicSourceLesson(sourceId(level, n)),
    fetchPublicSourceLessonsByLevel(level),
  ]);
  if (!result) notFound();
  const { row, payload } = result;
  const meta = HSK_LEVEL_META[level];
  const idx = siblings.findIndex((s) => s.id === row.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const base = `/books/hsk-standard-course/${level}`;

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/books", label: L(locale, "教材", "Ном") },
          { href: "/books/hsk-standard-course", label: "HSK标准教程" },
          { href: base, label: `HSK ${meta.titleZh}` },
          { label: `第${row.lesson}课` },
        ]}
      />
      <MobilePageHeader
        title={`第${row.lesson}课 ${row.title_zh}`}
        subtitle={`${row.book} · ${row.title_pinyin ?? ""}`}
      />
      <SourceLessonLearnerView data={payload} />
      <div className="mt-4 flex items-center justify-between gap-2">
        {prev ? (
          <Link href={`${base}/${prev.lesson}`} className="app-btn-secondary text-sm">
            ← {L(locale, `第${prev.lesson}课`, `${prev.lesson}-р хичээл`)}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`${base}/${next.lesson}`} className="app-btn-primary text-sm">
            {L(locale, `第${next.lesson}课`, `${next.lesson}-р хичээл`)} →
          </Link>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
