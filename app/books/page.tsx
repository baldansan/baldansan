import { BookCard } from "@/components/books/book-ui";
import { L } from "@/components/books/book-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { BOOKS } from "@/lib/books/catalog";
import { fetchPublicSourceLessonCounts } from "@/lib/books/source-public";
import { getServerUiLocale } from "@/lib/i18n/server-locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "教材 — Бөөндөө Сурцгаая",
};

export default async function BooksPage() {
  const [locale, counts] = await Promise.all([getServerUiLocale(), fetchPublicSourceLessonCounts()]);
  const hskTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={L(locale, "教材", "Ном сонгох")}
        subtitle={L(locale, "选择一本教材开始学习。", "Сурах номоо сонгоод эхэл.")}
      />
      <div className="grid grid-cols-1 gap-3">
        {BOOKS.map((b) => {
          const locked = b.status === "locked";
          const lessonsNote =
            b.id === "hsk-standard-course" && hskTotal > 0
              ? L(locale, `${hskTotal} 课已上线`, `${hskTotal} хичээл бэлэн`)
              : null;
          return (
            <BookCard key={b.id} href={b.href} locked={locked}>
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                  {b.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-[var(--app-text)]">
                      {b.titleZh}
                      {locale === "mn" ? (
                        <span className="block text-xs font-semibold text-[var(--app-muted)]">{b.titleMn}</span>
                      ) : null}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                        locked
                          ? "bg-slate-100 text-slate-500 ring-slate-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      }`}
                    >
                      {locked ? L(locale, "🔒 敬请期待", "🔒 Удахгүй") : L(locale, "已开放", "Нээлттэй")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">{b.publisherZh}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--app-text)]">
                    {L(locale, b.descriptionZh, b.descriptionMn)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {b.volumesZh}
                    {lessonsNote ? ` · ${lessonsNote}` : ""}
                  </p>
                </div>
              </div>
            </BookCard>
          );
        })}
      </div>
    </MobileAppShell>
  );
}
