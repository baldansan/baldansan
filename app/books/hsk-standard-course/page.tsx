import { BookCard, BookCrumbs, L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { HSK_LEVELS, HSK_LEVEL_META } from "@/lib/books/catalog";
import { fetchPublicSourceLessonCounts } from "@/lib/books/source-public";
import { getServerUiLocale } from "@/lib/i18n/server-locale";

export const dynamic = "force-dynamic";

export const metadata = { title: "HSK标准教程 — Бөөндөө Сурцгаая" };

export default async function HskBookPage() {
  const [locale, counts] = await Promise.all([getServerUiLocale(), fetchPublicSourceLessonCounts()]);
  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs items={[{ href: "/books", label: L(locale, "教材", "Ном") }, { label: "HSK标准教程" }]} />
      <MobilePageHeader
        title="HSK标准教程"
        subtitle={L(
          locale,
          "北京语言大学出版社 · 选择级别。每课包含课本、教师用书、练习册原文。",
          "БХИС хэвлэл · Түвшнээ сонго. Хичээл бүрт сурах бичиг, багшийн ном, дасгалын номын агуулга бий."
        )}
      />
      <div className="grid grid-cols-1 gap-3">
        {HSK_LEVELS.map((lv) => {
          const m = HSK_LEVEL_META[lv];
          const n = counts[lv] ?? 0;
          return (
            <BookCard key={lv} href={n > 0 ? `/books/hsk-standard-course/${lv}` : null} locked={n === 0}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white">
                  {lv.replace("hsk", "")}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-[var(--app-text)]">
                    HSK {m.titleZh} · {m.wordsZh}
                  </h2>
                  <p className="text-xs text-[var(--app-muted)]">{m.booksZh}</p>
                  <p className="mt-0.5 text-sm text-[var(--app-text)]">
                    {n > 0 ? L(locale, `${n} 课`, `${n} хичээл`) : L(locale, "即将上线", "Удахгүй")}
                  </p>
                </div>
                <span className="text-[var(--app-muted)]">›</span>
              </div>
            </BookCard>
          );
        })}
      </div>
    </MobileAppShell>
  );
}
