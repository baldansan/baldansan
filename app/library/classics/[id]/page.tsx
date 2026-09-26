import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { Pager, SearchForm, SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import {
  getMengxue,
  getSongci,
  getTangshi,
  intParam,
  paginate,
  strParam,
  type ClassicLine,
  type ClassicWork,
  type Poem,
} from "@/lib/library/data";

export const dynamic = "force-dynamic";

const LINES_PER_PAGE = 120;
const POEMS_PER_PAGE = 30;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const COLLECTIONS: Record<string, { zh: string; mn: string; load: typeof getTangshi }> = {
  tangshi: { zh: "唐诗三百首", mn: "Тан улсын 300 шүлэг", load: getTangshi },
  songci: { zh: "宋词三百首", mn: "Сун улсын 300 ци", load: getSongci },
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (COLLECTIONS[id]) return { title: `${COLLECTIONS[id].zh} — Бөөндөө Сурцгаая` };
  const m = await getMengxue();
  const w = m.works.find((x) => x.id === id);
  return { title: w ? `${w.title} — Бөөндөө Сурцгаая` : "经典 — Бөөндөө Сурцгаая" };
}

function hrefFor(base: string, q: string, page: number): string {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (page > 1) sp.set("page", String(page));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

/* ---------------- Шүлгийн карт ---------------- */

function PoemCard({ poem }: { poem: Poem }) {
  const meta = [poem.dynasty, poem.author].filter(Boolean).join(" · ");
  return (
    <li className="app-card p-4" translate="no">
      <h3 className="hanzi text-lg font-bold text-[var(--app-text)]">{poem.title}</h3>
      <p className="mt-0.5 text-xs text-[var(--app-muted)]">
        {meta}
        {poem.form ? ` · ${poem.form}` : ""}
      </p>
      <div className="mt-3 space-y-2">
        {poem.paragraphs.map((pg) => (
          <div key={pg.id}>
            <p className="hanzi text-lg leading-relaxed tracking-wide text-[var(--app-text)]">{pg.zh}</p>
            <p className="text-xs leading-5 text-[var(--app-muted)]">{pg.pinyin}</p>
          </div>
        ))}
      </div>
    </li>
  );
}

function PoemList({
  locale,
  base,
  titleZh,
  titleMn,
  poems,
  q,
  pageNo,
  crumbLabel,
  note,
}: {
  locale: UiLocale;
  base: string;
  titleZh: string;
  titleMn: string;
  poems: Poem[];
  q: string;
  pageNo: number;
  crumbLabel: string;
  note?: string;
}) {
  const needle = q.toLowerCase();
  const filtered = needle
    ? poems.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.author.toLowerCase().includes(needle) ||
          p.paragraphs.some((pg) => pg.zh.includes(q)),
      )
    : poems;
  const { items, page, pages, total } = paginate(filtered, pageNo, POEMS_PER_PAGE);

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { href: "/library/classics", label: L(locale, "经典", "Сонгодог") },
          { label: crumbLabel },
        ]}
      />
      <MobilePageHeader
        title={titleZh}
        subtitle={
          locale === "mn"
            ? `${titleMn} · ${poems.length} шүлэг`
            : `${poems.length} 首`
        }
      />
      <SearchForm
        locale={locale}
        action={base}
        q={q}
        placeholder={L(locale, "题目 / 作者 / 诗句…", "Нэр / зохиогч / мөр…")}
      />
      {q ? (
        <p className="mb-2 text-xs text-[var(--app-muted)]">
          {L(locale, `找到 ${total} 首`, `${total} олдлоо`)}
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className="app-card p-4 text-sm text-[var(--app-muted)]">{L(locale, "没有找到。", "Олдсонгүй.")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {items.map((p) => (
            <PoemCard key={p.id} poem={p} />
          ))}
        </ul>
      )}
      <Pager locale={locale} page={page} pages={pages} total={total} hrefFor={(p) => hrefFor(base, q, p)} />
      <SourceNote>
        chinese-poetry dataset (MIT; texts public domain) · pinyin by pypinyin (
        {L(locale, "多音字待老师校对", "多音字 багш шалгана")}){note ? ` · ${note}` : ""}
      </SourceNote>
    </MobileAppShell>
  );
}

/* ---------------- Мөр бүхий бичвэр (三字经, 弟子规 …) ---------------- */

type FlatLine = { chapter: string | null; line: ClassicLine };

function flattenLines(work: ClassicWork): FlatLine[] {
  const out: FlatLine[] = [];
  for (const sec of work.sections ?? []) {
    sec.lines.forEach((line, i) => {
      out.push({ chapter: i === 0 ? sec.chapter : null, line });
    });
  }
  return out;
}

export default async function ClassicWorkPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const q = strParam(sp.q);
  const pageNo = intParam(sp.page, 1);
  const base = `/library/classics/${id}`;

  // 唐诗 / 宋词 — нэг маршрут дотор
  const col = COLLECTIONS[id];
  if (col) {
    const [locale, data] = await Promise.all([getServerUiLocale(), col.load()]);
    return (
      <PoemList
        locale={locale}
        base={base}
        titleZh={col.zh}
        titleMn={col.mn}
        poems={data.poems}
        q={q}
        pageNo={pageNo}
        crumbLabel={col.zh}
      />
    );
  }

  const [locale, mengxue] = await Promise.all([getServerUiLocale(), getMengxue()]);
  const work = mengxue.works.find((w) => w.id === id);
  if (!work) notFound();

  const meta = [work.dynasty, work.author].filter(Boolean).join(" · ");

  // 千家诗 — шүлгүүд
  if (work.poems) {
    return (
      <PoemList
        locale={locale}
        base={base}
        titleZh={work.title}
        titleMn={meta}
        poems={work.poems}
        q={q}
        pageNo={pageNo}
        crumbLabel={work.title}
        note={work.edition}
      />
    );
  }

  const flat = flattenLines(work);
  const { items, page, pages, total } = paginate(flat, pageNo, LINES_PER_PAGE);
  const chapterCount = (work.sections ?? []).filter((s) => s.chapter).length;

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { href: "/library/classics", label: L(locale, "经典", "Сонгодог") },
          { label: work.title },
        ]}
      />
      <MobilePageHeader
        title={work.title}
        subtitle={[
          meta,
          L(locale, `${total} 句`, `${total} мөр`),
          chapterCount > 0 ? L(locale, `${chapterCount} 章`, `${chapterCount} бүлэг`) : "",
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <ol className="app-card divide-y divide-slate-100" translate="no">
        {items.map(({ chapter, line }) => (
          <li key={line.id} className="px-4 py-3">
            {chapter ? (
              <h2 className="hanzi mb-2 text-sm font-bold text-emerald-700">{chapter}</h2>
            ) : null}
            <p className="hanzi text-lg leading-relaxed tracking-wide text-[var(--app-text)]">{line.zh}</p>
            <p className="mt-0.5 text-xs leading-5 text-[var(--app-muted)]">{line.pinyin}</p>
          </li>
        ))}
      </ol>

      <Pager locale={locale} page={page} pages={pages} total={total} hrefFor={(p) => hrefFor(base, "", p)} />

      <SourceNote>
        chinese-poetry dataset (MIT; texts public domain) · pinyin by pypinyin (
        {L(locale, "多音字待老师校对", "多音字 багш шалгана")})
        {work.edition ? ` · ${work.edition}` : ""}
      </SourceNote>
    </MobileAppShell>
  );
}
