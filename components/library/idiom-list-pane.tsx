import Link from "next/link";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { Chips, LevelBadge, Pager, SearchForm } from "@/components/library/library-ui";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import type { UiLocale } from "@/lib/i18n/locale-types";
import type { Idiom } from "@/lib/library/data";
import {
  IDIOM_KINDS,
  IDIOM_LEVELS,
  IDIOM_PER_PAGE,
  idiomDetailHref,
  idiomLevelLabel,
  idiomListHref,
  type IdiomListParams,
} from "@/lib/library/idiom-list";
import { paginate } from "@/lib/library/data";

function IdiomCard({
  x,
  params,
  selected,
}: {
  x: Idiom;
  params: IdiomListParams;
  selected: boolean;
}) {
  return (
    <li>
      <Link
        href={idiomDetailHref(x.id, params)}
        className={`app-card block p-4 transition-colors active:bg-slate-50 bs-lib-card${selected ? " bs-lib-card--on" : ""}`}
        aria-current={selected ? "true" : undefined}
        data-idiom-id={x.id}
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
            <p className="mt-1 text-xs leading-5 text-[var(--app-text)] bs-lib-card-extra">直译: {x.literal}</p>
          ) : null}
          {x.etymology ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--app-muted)] bs-lib-card-extra">出处: {x.etymology}</p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

type Props = {
  locale: UiLocale;
  params: IdiomListParams;
  /** Шүүсэн бүтэн жагсаалт (lib/library/idiom-list filterIdioms). */
  filtered: Idiom[];
  totalAll: number;
  selectedId?: string | null;
};

/**
 * Хэлц үгийн жагсаалт: гарчиг, төрөл/түвшний чип, хайлт, картууд, хуудаслалт.
 * Утсан дээр бүтэн хуудас, PC дээр зүүн самбар (app/library/idioms/*).
 */
export function IdiomListPane({ locale, params, filtered, totalAll, selectedId }: Props) {
  const { kind, level, q, hsk, page: pageNo } = params;
  const { items, page, pages, total } = paginate(filtered, pageNo, IDIOM_PER_PAGE);

  const kindChips = IDIOM_KINDS.map((k) => ({
    href: idiomListHref({ kind: k.key }),
    label: L(locale, k.zh, k.mn),
    active: kind === k.key,
  }));
  const levelChips = [
    { href: idiomListHref({ kind, q, hsk }), label: L(locale, "全部", "Бүгд"), active: level === 0 },
    ...IDIOM_LEVELS.map((lv) => ({
      href: idiomListHref({ kind, level: lv, q, hsk }),
      label: idiomLevelLabel(lv),
      active: level === lv,
    })),
    ...(kind === "idioms"
      ? [
          {
            href: idiomListHref({ kind, level, q, hsk: !hsk }),
            label: L(locale, "HSK 词表", "HSK үгийн жагсаалт"),
            active: hsk,
          },
        ]
      : []),
  ];
  const kindMeta = IDIOM_KINDS.find((k) => k.key === kind) ?? IDIOM_KINDS[0];
  const hidden: Record<string, string> = {};
  if (kind !== "idioms") hidden.kind = kind;
  if (level > 0) hidden.level = String(level);
  if (hsk) hidden.hsk = "1";

  return (
    <div className="bs-lib-list">
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { label: L(locale, "成语 · 谚语 · 歇后语", "Хэлц үг · Зүйр цэцэн үг") },
        ]}
      />
      <MobilePageHeader
        title={L(locale, kindMeta.zh, kindMeta.mn)}
        subtitle={L(
          locale,
          `${totalAll.toLocaleString("en-US")} 条 · 按 HSK 级别筛选`,
          `${totalAll.toLocaleString("en-US")} хэллэг · HSK түвшнээр шүүнэ`
        )}
      />
      <Chips items={kindChips} />
      <Chips items={levelChips} />
      <SearchForm
        locale={locale}
        action="/library/idioms"
        q={q}
        hidden={hidden}
        placeholder={L(locale, "搜索汉字或蒙古语…", "Ханз эсвэл монголоор хайх…")}
      />

      {items.length === 0 ? (
        <p className="app-card p-4 text-sm text-[var(--app-muted)]">
          {L(locale, "没有符合条件的条目。", "Тохирох хэллэг алга.")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 bs-lib-cards">
          {items.map((x) => (
            <IdiomCard key={x.id} x={x} params={params} selected={x.id === selectedId} />
          ))}
        </ul>
      )}

      <Pager
        locale={locale}
        page={page}
        pages={pages}
        total={total}
        hrefFor={(p) => idiomListHref({ kind, level, q, hsk, page: p })}
      />
    </div>
  );
}
