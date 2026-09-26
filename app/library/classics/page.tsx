import Link from "next/link";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getMengxue, getSongci, getTangshi, type ClassicWork } from "@/lib/library/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "蒙学经典 · 唐诗 · 宋词 — Бөөндөө Сурцгаая",
};

function workCount(w: ClassicWork): { n: number; unit: "poems" | "lines" } {
  if (w.poems) return { n: w.poems.length, unit: "poems" };
  return { n: (w.sections ?? []).reduce((a, s) => a + s.lines.length, 0), unit: "lines" };
}

export default async function ClassicsPage() {
  const [locale, mengxue, tangshi, songci] = await Promise.all([
    getServerUiLocale(),
    getMengxue(),
    getTangshi(),
    getSongci(),
  ]);

  const sectionTitle = (zh: string, mn: string) => (
    <h2 className="mb-2 mt-5 first:mt-0">
      <span className="block text-base font-bold text-[var(--app-text)]">{zh}</span>
      {locale === "mn" ? <span className="block text-xs font-semibold text-[var(--app-muted)]">{mn}</span> : null}
    </h2>
  );

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { label: L(locale, "经典", "Сонгодог") },
        ]}
      />
      <MobilePageHeader
        title={L(locale, "蒙学经典 · 唐诗 · 宋词", "Сонгодог бичвэр · Шүлэг")}
        subtitle={L(locale, "全文注音，逐句阅读。", "Бүх бичвэр пиньинтэй, мөр мөрөөр уншина.")}
      />

      {sectionTitle("蒙学经典", "Сургалтын сонгодог бичвэр")}
      <ul className="grid grid-cols-1 gap-2">
        {mengxue.works.map((w) => {
          const c = workCount(w);
          const meta = [w.dynasty, w.author].filter(Boolean).join(" · ");
          return (
            <li key={w.id}>
              <Link
                href={`/library/classics/${w.id}`}
                className="app-card flex items-center gap-3 p-3 transition-colors active:bg-slate-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-xl">
                  📜
                </span>
                <span className="min-w-0 flex-1" translate="no">
                  <span className="hanzi block text-base font-bold text-[var(--app-text)]">{w.title}</span>
                  {meta ? <span className="block truncate text-xs text-[var(--app-muted)]">{meta}</span> : null}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                  {c.unit === "poems"
                    ? L(locale, `${c.n} 首`, `${c.n} шүлэг`)
                    : L(locale, `${c.n} 句`, `${c.n} мөр`)}
                </span>
                <span className="text-[var(--app-muted)]">›</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {sectionTitle("唐诗三百首", "Тан улсын 300 шүлэг")}
      <Link
        href="/library/classics/tangshi"
        className="app-card flex items-center gap-3 p-3 transition-colors active:bg-slate-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">🏯</span>
        <span className="min-w-0 flex-1">
          <span className="hanzi block text-base font-bold text-[var(--app-text)]" translate="no">
            唐诗三百首
          </span>
          <span className="block text-xs text-[var(--app-muted)]">
            {L(locale, `${tangshi.poems.length} 首 · 可按题目、作者、诗句搜索`, `${tangshi.poems.length} шүлэг · нэр, зохиогч, мөрөөр хайна`)}
          </span>
        </span>
        <span className="text-[var(--app-muted)]">›</span>
      </Link>

      {sectionTitle("宋词三百首", "Сун улсын 300 ци")}
      <Link
        href="/library/classics/songci"
        className="app-card flex items-center gap-3 p-3 transition-colors active:bg-slate-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl">🎋</span>
        <span className="min-w-0 flex-1">
          <span className="hanzi block text-base font-bold text-[var(--app-text)]" translate="no">
            宋词三百首
          </span>
          <span className="block text-xs text-[var(--app-muted)]">
            {L(locale, `${songci.poems.length} 首 · 可按题目、作者、词句搜索`, `${songci.poems.length} ци · нэр, зохиогч, мөрөөр хайна`)}
          </span>
        </span>
        <span className="text-[var(--app-muted)]">›</span>
      </Link>

      <SourceNote>
        chinese-poetry dataset (MIT; texts public domain) · pinyin by pypinyin (
        {L(locale, "多音字待老师校对", "多音字 багш шалгана")})
      </SourceNote>
    </MobileAppShell>
  );
}
