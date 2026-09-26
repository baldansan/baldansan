import { BookCrumbs, L } from "@/components/books/book-ui";
import { Chips, Pager, SearchForm, SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import {
  getSentences,
  getZhMnSentences,
  intParam,
  paginate,
  strParam,
  type Sentence,
  type SentenceSource,
} from "@/lib/library/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "例句 — Бөөндөө Сурцгаая",
};

const PER_PAGE = 50;
const TATOEBA_LEVELS = [1, 2, 3, 4];
const ZHONGDEX_LEVELS = [1, 2, 3, 4, 5, 6, 7];

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

type Params = { src: SentenceSource; level: number; q: string; reviewed: boolean; page?: number };

function parseSrc(v: string): SentenceSource {
  return v === "zhongdex" ? "zhongdex" : "tatoeba";
}

function hrefFor(p: Params): string {
  const sp = new URLSearchParams();
  if (p.src !== "tatoeba") sp.set("src", p.src);
  if (p.level > 0) sp.set("level", String(p.level));
  if (p.reviewed) sp.set("reviewed", "1");
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const s = sp.toString();
  return s ? `/library/sentences?${s}` : "/library/sentences";
}

/* Анхдагч эрэмбэ (түвшин ↑, дараа нь богино нь эхэнд) — эх сурвалж тус бүрээр процесст нэг л удаа. */
const sortedCache = new Map<SentenceSource, Promise<Sentence[]>>();
function getSortedSentences(src: SentenceSource): Promise<Sentence[]> {
  let p = sortedCache.get(src);
  if (!p) {
    p = getSentences(src).then((items) =>
      [...items].sort((a, b) => a.level - b.level || a.zh.length - b.zh.length),
    );
    sortedCache.set(src, p);
  }
  return p;
}

const HAN_RE = /\p{Script=Han}/u;

function makeMatcher(q: string): (s: Sentence) => boolean {
  if (!q) return () => true;
  if (HAN_RE.test(q)) return (s) => s.zh.includes(q);
  const lq = q.toLowerCase();
  return (s) =>
    s.zh.includes(q) ||
    s.pinyin.toLowerCase().includes(lq) ||
    (s.en ? s.en.toLowerCase().includes(lq) : false);
}

function levelLabel(lv: number): string {
  return lv >= 7 ? "7–9" : String(lv);
}

function SentenceRow({ s }: { s: Sentence }) {
  return (
    <li className="app-card p-3.5" translate="no">
      <p className="hanzi text-lg leading-7 text-[var(--app-text)]">{s.zh}</p>
      <p className="mt-0.5 text-sm text-[var(--app-muted)]">{s.pinyin}</p>
      {s.en ? <p className="mt-0.5 text-sm leading-5 text-[var(--app-text)]">{s.en}</p> : null}
    </li>
  );
}

export default async function LibrarySentencesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const locale: UiLocale = await getServerUiLocale();

  const src = parseSrc(strParam(sp.src));
  const level = intParam(sp.level, 0);
  const q = strParam(sp.q);
  const reviewed = src === "tatoeba" && strParam(sp.reviewed) === "1";
  const pageNo = intParam(sp.page, 1);

  const showZhMn = src === "tatoeba" && level === 0 && !q && !reviewed && pageNo === 1;

  const [all, zhMn] = await Promise.all([
    getSortedSentences(src),
    showZhMn ? getZhMnSentences() : Promise.resolve([]),
  ]);

  const matches = makeMatcher(q);
  const filtered = all.filter(
    (s) =>
      (level > 0 ? (level >= 7 ? s.level >= 7 : s.level === level) : true) &&
      (reviewed ? s.pinyin_src === "tatoeba-reviewed" : true) &&
      matches(s),
  );
  const { items, page, pages, total } = paginate(filtered, pageNo, PER_PAGE);

  const srcChips = [
    { href: hrefFor({ src: "tatoeba", level: 0, q: "", reviewed: false }), label: "Tatoeba", active: src === "tatoeba" },
    { href: hrefFor({ src: "zhongdex", level: 0, q: "", reviewed: false }), label: "Zhongdex", active: src === "zhongdex" },
  ];

  const levels = src === "zhongdex" ? ZHONGDEX_LEVELS : TATOEBA_LEVELS;
  const levelChips = [
    { href: hrefFor({ src, level: 0, q, reviewed }), label: L(locale, "全部", "Бүгд"), active: level === 0 },
    ...levels.map((lv) => ({
      href: hrefFor({ src, level: lv, q, reviewed }),
      label: levelLabel(lv),
      active: level === lv,
    })),
    ...(src === "tatoeba"
      ? [
          {
            href: hrefFor({ src, level, q, reviewed: !reviewed }),
            label: L(locale, "✓ 已校拼音", "✓ Шалгасан пиньинь"),
            active: reviewed,
          },
        ]
      : []),
  ];

  const hidden: Record<string, string> = {};
  if (src !== "tatoeba") hidden.src = src;
  if (level > 0) hidden.level = String(level);
  if (reviewed) hidden.reviewed = "1";

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { label: L(locale, "例句", "Жишээ өгүүлбэр") },
        ]}
      />
      <MobilePageHeader
        title={L(locale, "例句", "Жишээ өгүүлбэр")}
        subtitle={L(
          locale,
          `${all.length.toLocaleString("en-US")} 个例句 · 按 HSK 级别筛选 · 带拼音和英文`,
          `${all.length.toLocaleString("en-US")} өгүүлбэр · HSK түвшнээр шүүнэ · пиньинь, англи орчуулгатай`,
        )}
      />
      {src === "zhongdex" ? (
        <p className="-mt-2 mb-3 text-xs leading-5 text-[var(--app-muted)]">
          {L(
            locale,
            "级别按本应用的 HSK 词表 (level_app)",
            "Түвшин манай апп-ын HSK үгсийн жагсаалтаар (level_app)",
          )}
        </p>
      ) : null}

      <Chips items={srcChips} />
      <Chips items={levelChips} />
      <SearchForm
        locale={locale}
        action="/library/sentences"
        q={q}
        hidden={hidden}
        placeholder={L(locale, "搜索汉字、拼音或英文…", "Ханз, пиньинь эсвэл англиар хайх…")}
      />

      {showZhMn && zhMn.length > 0 ? (
        <details className="app-card mb-3 p-3.5">
          <summary className="cursor-pointer text-sm font-bold text-[var(--app-text)]">
            {L(locale, `🇲🇳 中蒙对照 (${zhMn.length} 句)`, `🇲🇳 Хятад–Монгол (${zhMn.length} өгүүлбэр)`)}
          </summary>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {L(locale, "目前仅这些句子有蒙古语翻译。", "Одоогоор зөвхөн эдгээр өгүүлбэр монгол орчуулгатай.")}
          </p>
          <ul className="mt-3 space-y-3" translate="no">
            {zhMn.map((s) => (
              <li key={String(s.id)} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                <p className="hanzi text-lg leading-7 text-[var(--app-text)]">{s.zh}</p>
                <p className="mt-0.5 text-sm text-[var(--app-muted)]">{s.pinyin}</p>
                <p className="mt-0.5 text-sm leading-5 text-[var(--app-text)]">{s.mn}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {items.length === 0 ? (
        <p className="app-card p-4 text-sm text-[var(--app-muted)]">
          {L(locale, "没有符合条件的句子。", "Тохирох өгүүлбэр алга.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <SentenceRow key={String(s.id)} s={s} />
          ))}
        </ul>
      )}

      <Pager
        locale={locale}
        page={page}
        pages={pages}
        total={total}
        hrefFor={(p) => hrefFor({ src, level, q, reviewed, page: p })}
      />

      <SourceNote>
        Tatoeba (CC BY 2.0 FR, tatoeba.org) · Zhongdex by SayMei (CC BY-SA 4.0, github.com/saymei/zhongdex)
      </SourceNote>
    </MobileAppShell>
  );
}
