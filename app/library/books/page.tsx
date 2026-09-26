import Link from "next/link";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { Chips, Pager, SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getStories, intParam, paginate, strParam } from "@/lib/library/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "绘本 — Бөөндөө Сурцгаая",
};

const PER_PAGE = 24;
const LEVELS = [1, 2, 3, 4, 5];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function hrefFor(params: { level: number; audio: boolean; page?: number }): string {
  const q = new URLSearchParams();
  if (params.level > 0) q.set("level", String(params.level));
  if (params.audio) q.set("audio", "1");
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const s = q.toString();
  return s ? `/library/books?${s}` : "/library/books";
}

export default async function LibraryBooksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [locale, all] = await Promise.all([getServerUiLocale(), getStories()]);

  const level = intParam(sp.level, 0);
  const audio = strParam(sp.audio) === "1";
  const pageNo = intParam(sp.page, 1);

  const filtered = all.filter(
    (s) => (level > 0 ? s.level === level : true) && (audio ? s.provider === "gsb" : true),
  );
  const { items, page, pages, total } = paginate(filtered, pageNo, PER_PAGE);

  const chips = [
    { href: hrefFor({ level: 0, audio }), label: L(locale, "全部", "Бүгд"), active: level === 0 },
    ...LEVELS.map((lv) => ({
      href: hrefFor({ level: lv, audio }),
      label: `L${lv}`,
      active: level === lv,
    })),
    {
      href: hrefFor({ level, audio: !audio }),
      label: L(locale, "🔊 带音频", "🔊 Дуутай"),
      active: audio,
    },
  ];

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { label: L(locale, "绘本", "Зурагт ном") },
        ]}
      />
      <MobilePageHeader
        title={L(locale, "绘本", "Хүүхдийн зурагт ном")}
        subtitle={L(
          locale,
          `${all.length} 本图画书 · 按阅读级别选书（1 最易）`,
          `${all.length} зурагт ном · уншлагын түвшнээр сонгоно (1 хамгийн хялбар)`,
        )}
      />
      <Chips items={chips} />

      {items.length === 0 ? (
        <p className="app-card p-4 text-sm text-[var(--app-muted)]">
          {L(locale, "没有符合条件的书。", "Тохирох ном алга.")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/library/books/${s.id}`}
                className="app-card block overflow-hidden transition-colors active:bg-slate-50"
              >
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-100 text-4xl">
                  {s.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.cover}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span aria-hidden>📖</span>
                  )}
                </div>
                <div className="p-2.5" translate="no">
                  <p className="hanzi line-clamp-2 text-sm font-bold leading-5 text-[var(--app-text)]">{s.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted)]">{s.title_pinyin}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[10px] font-bold">
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                      L{s.level}
                    </span>
                    {s.provider === "gsb" ? (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-amber-200">
                        🔊
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600 ring-1 ring-slate-200">
                      {s.page_count} 页
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pager
        locale={locale}
        page={page}
        pages={pages}
        total={total}
        hrefFor={(p) => hrefFor({ level, audio, page: p })}
      />

      <SourceNote>
        Global Storybooks (CC BY 4.0 / CC BY 3.0, globalstorybooks.net) · StoryWeaver / Pratham Books (CC BY 4.0,
        storyweaver.org.in)
      </SourceNote>
    </MobileAppShell>
  );
}
