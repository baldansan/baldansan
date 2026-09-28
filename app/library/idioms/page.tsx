import Link from "next/link";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { Chips, LevelBadge, Pager, SearchForm, SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import {
  getIdioms,
  intParam,
  paginate,
  strParam,
  type Idiom,
  type IdiomKind,
} from "@/lib/library/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "成语 · 谚语 · 歇后语 — Бөөндөө Сурцгаая",
};

const PER_PAGE = 40;
const LEVELS = [1, 2, 3, 4, 5, 6, 7];

type Kind = IdiomKind;
const KINDS: Array<{ key: Kind; zh: string; mn: string }> = [
  { key: "idioms", zh: "成语", mn: "Хэлц үг" },
  { key: "proverbs", zh: "谚语", mn: "Зүйр цэцэн үг" },
  { key: "xiehouyu", zh: "歇后语", mn: "Ёгт хэллэг (歇后语)" },
];

function parseKind(v: string): Kind {
  return (KINDS.find((k) => k.key === v)?.key ?? "idioms") as Kind;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

type Params = { kind: Kind; level: number; q: string; hsk: boolean; page?: number };

function hrefFor(p: Params): string {
  const sp = new URLSearchParams();
  if (p.kind !== "idioms") sp.set("kind", p.kind);
  if (p.level > 0) sp.set("level", String(p.level));
  if (p.hsk) sp.set("hsk", "1");
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const s = sp.toString();
  return s ? `/library/idioms?${s}` : "/library/idioms";
}

/* Эрэмбэлсэн жагсаалтыг төрөл тус бүрээр нэг л удаа бэлдэнэ (процесст нэг удаа). */
const sortedCache = new Map<IdiomKind, Promise<Idiom[]>>();
function getSortedIdioms(kind: IdiomKind): Promise<Idiom[]> {
  let p = sortedCache.get(kind);
  if (!p) {
    p = getIdioms(kind).then((items) =>
      [...items].sort(
        (a, b) =>
          (a.in_hsk_list ? 0 : 1) - (b.in_hsk_list ? 0 : 1) ||
          a.level - b.level ||
          a.id.localeCompare(b.id),
      ),
    );
    sortedCache.set(kind, p);
  }
  return p;
}

function levelLabel(lv: number): string {
  return lv >= 7 ? "HSK 7–9" : `HSK ${lv}`;
}

function matchesQuery(x: Idiom, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  return x.zh.includes(q) || (x.zh_trad?.includes(q) ?? false) || x.en.some((e) => e.toLowerCase().includes(lq));
}

/* ---------------- Картууд ---------------- */

function IdiomCard({ x }: { x: Idiom }) {
  return (
    <li>
      <Link
        href={`/library/idioms/${encodeURIComponent(x.id)}`}
        className="app-card block p-4 transition-colors active:bg-slate-50"
      >
        <div translate="no">
          <div className="flex items-start justify-between gap-2">
            <p className="hanzi text-xl font-bold text-[var(--app-text)]">{x.zh}</p>
            <LevelBadge level={x.level} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--app-muted)]">
            {x.pinyin_syllables ?? x.pinyin}
            {x.pinyin_check ? (
              <span className="ml-1 text-[10px] text-amber-600" title="拼音待校">
                ⚠ 拼音待校
              </span>
            ) : null}
          </p>
          {x.mn ? (
            <p className="mt-1 text-sm leading-5 text-emerald-800">💡 {x.mn.keyMn}</p>
          ) : x.en.length > 0 ? (
            <p className="mt-1 text-sm leading-5 text-[var(--app-text)]">{x.en.join("; ")}</p>
          ) : null}
          {x.literal ? (
            <p className="mt-1 text-xs leading-5 text-[var(--app-text)]">直译: {x.literal}</p>
          ) : null}
          {x.etymology ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--app-muted)]">出处: {x.etymology}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

/* ---------------- Хуудас ---------------- */

export default async function LibraryIdiomsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale: UiLocale = await getServerUiLocale();

  const kind = parseKind(strParam(sp.kind));
  const level = intParam(sp.level, 0);
  const q = strParam(sp.q);
  const hsk = strParam(sp.hsk) === "1";
  const pageNo = intParam(sp.page, 1);

  const kindChips = KINDS.map((k) => ({
    href: hrefFor({ kind: k.key, level: 0, q: "", hsk: false }),
    label: L(locale, k.zh, k.mn),
    active: kind === k.key,
  }));

  const crumbs = (
    <BookCrumbs
      items={[
        { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
        { label: L(locale, "成语 · 谚语 · 歇后语", "Хэлц үг · Зүйр цэцэн үг") },
      ]}
    />
  );

  /* ---- 成语 / 谚语 / 歇后语 ---- */
  const all = await getSortedIdioms(kind);
  const filtered = all.filter(
    (x) =>
      (level > 0 ? (level >= 7 ? x.level >= 7 : x.level === level) : true) &&
      (hsk ? Boolean(x.in_hsk_list) : true) &&
      matchesQuery(x, q),
  );
  const { items, page, pages, total } = paginate(filtered, pageNo, PER_PAGE);

  const levelChips = [
    { href: hrefFor({ kind, level: 0, q, hsk }), label: L(locale, "全部", "Бүгд"), active: level === 0 },
    ...LEVELS.map((lv) => ({
      href: hrefFor({ kind, level: lv, q, hsk }),
      label: levelLabel(lv),
      active: level === lv,
    })),
    ...(kind === "idioms"
      ? [
          {
            href: hrefFor({ kind, level, q, hsk: !hsk }),
            label: L(locale, "HSK 词表", "HSK үгийн жагсаалт"),
            active: hsk,
          },
        ]
      : []),
  ];

  const kindMeta = KINDS.find((k) => k.key === kind)!;
  const hidden: Record<string, string> = {};
  if (kind !== "idioms") hidden.kind = kind;
  if (level > 0) hidden.level = String(level);
  if (hsk) hidden.hsk = "1";

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      {crumbs}
      <MobilePageHeader
        title={L(locale, kindMeta.zh, kindMeta.mn)}
        subtitle={L(
          locale,
          `${all.length.toLocaleString("en-US")} 条 · 按 HSK 级别筛选 · 带拼音和英文释义`,
          `${all.length.toLocaleString("en-US")} хэллэг · HSK түвшнээр шүүнэ · пиньинь, англи тайлбартай`,
        )}
      />
      <Chips items={kindChips} />
      <Chips items={levelChips} />
      <SearchForm
        locale={locale}
        action="/library/idioms"
        q={q}
        hidden={hidden}
        placeholder={L(locale, "搜索汉字或英文…", "Ханз эсвэл англиар хайх…")}
      />

      {items.length === 0 ? (
        <p className="app-card p-4 text-sm text-[var(--app-muted)]">
          {L(locale, "没有符合条件的条目。", "Тохирох хэллэг алга.")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {items.map((x) => (
            <IdiomCard key={x.id} x={x} />
          ))}
        </ul>
      )}

      <Pager
        locale={locale}
        page={page}
        pages={pages}
        total={total}
        hrefFor={(p) => hrefFor({ kind, level, q, hsk, page: p })}
      />

      <SourceNote>
        Wiktionary (CC BY-SA 4.0, en.wiktionary.org) via kaikki.org ·{" "}
        {L(locale, "拼音由程序生成，多音字待老师校对", "Пиньинийг програм үүсгэсэн; олон дуудлагатай ханзыг багш шалгана")}
      </SourceNote>
    </MobileAppShell>
  );
}
