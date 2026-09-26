import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { HSK_LEVEL_META, isHskLevelId } from "@/lib/books/catalog";
import { fetchPublicSourceLessonsByLevel } from "@/lib/books/source-public";
import { getPublicLessonSummariesByCourseId, lessonPath } from "@/lib/content";
import { getServerUiLocale } from "@/lib/i18n/server-locale";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ level: string }> };

export async function generateMetadata({ params }: Props) {
  const { level } = await params;
  return { title: `HSK标准教程 ${level.toUpperCase()} — Бөөндөө Сурцгаая` };
}

/** Аппын интерактив хичээлийн id-г эх сурвалжийн хичээлийн дугаартай тааруулна. */
function interactiveIdFor(ids: string[], sourceId: string, lesson: number): string | null {
  if (ids.includes(sourceId)) return sourceId;
  const n2 = String(lesson).padStart(2, "0");
  const hit = ids.find((id) => new RegExp(`(?:^|[-_])(?:l|lesson-?)0?${lesson}$|-${n2}$`, "i").test(id));
  return hit ?? null;
}

export default async function HskLevelPage({ params }: Props) {
  const { level } = await params;
  if (!isHskLevelId(level)) notFound();
  const [locale, rows, appLessons] = await Promise.all([
    getServerUiLocale(),
    fetchPublicSourceLessonsByLevel(level),
    getPublicLessonSummariesByCourseId(level).catch(() => []),
  ]);
  if (rows.length === 0) notFound();
  const meta = HSK_LEVEL_META[level];
  const appIds = appLessons.map((l) => l.id);
  const books = Array.from(new Set(rows.map((r) => r.book)));

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/books", label: L(locale, "教材", "Ном") },
          { href: "/books/hsk-standard-course", label: "HSK标准教程" },
          { label: `HSK ${meta.titleZh}` },
        ]}
      />
      <MobilePageHeader
        title={`HSK${level.replace("hsk", "")} · ${meta.titleZh}`}
        subtitle={`${meta.booksZh} · ${L(locale, `${rows.length} 课`, `${rows.length} хичээл`)}`}
        badge={meta.wordsZh}
      />
      {appIds.length > 0 ? (
        <MobileCard className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--app-text)]">
            {L(locale, `互动课程：${appIds.length} 课已上线`, `Интерактив хичээл: ${appIds.length} бэлэн`)}
          </p>
          <Link href={`/courses/${level}`} className="app-btn-primary shrink-0 !min-h-[36px] !px-3 text-xs">
            {L(locale, "打开", "Нээх")}
          </Link>
        </MobileCard>
      ) : null}
      {books.map((book) => (
        <section key={book} className="mb-4">
          {books.length > 1 ? (
            <h2 className="mb-2 text-sm font-bold text-[var(--app-muted)]">{book}</h2>
          ) : null}
          <ol className="grid grid-cols-1 gap-2">
            {rows
              .filter((r) => r.book === book)
              .map((r) => {
                const inter = interactiveIdFor(appIds, r.id, r.lesson);
                return (
                  <li key={r.id} className="app-card flex items-center gap-3 p-3">
                    <Link
                      href={`/books/hsk-standard-course/${level}/${r.lesson}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                        {r.lesson}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="hanzi block text-base font-bold text-[var(--app-text)]" translate="no">
                          {r.title_zh}
                        </span>
                        <span className="block truncate text-xs text-[var(--app-muted)]" translate="no">
                          {r.title_pinyin}
                          {r.title_en ? ` · ${r.title_en}` : ""}
                        </span>
                      </span>
                    </Link>
                    {inter ? (
                      <Link
                        href={lessonPath(inter)}
                        className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        {L(locale, "互动", "Интерактив")}
                      </Link>
                    ) : null}
                    <Link href={`/books/hsk-standard-course/${level}/${r.lesson}`} className="text-[var(--app-muted)]" aria-label="open">
                      ›
                    </Link>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </MobileAppShell>
  );
}
