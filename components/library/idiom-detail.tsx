import Link from "next/link";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { LevelBadge, SourceNote } from "@/components/library/library-ui";
import type { UiLocale } from "@/lib/i18n/locale-types";
import type { Idiom, IdiomKind } from "@/lib/library/data";
import { IDIOM_KINDS, idiomListHref } from "@/lib/library/idiom-list";

const HAN_RE = /\p{Script=Han}/u;

/** Ханз тус бүр — толь бичигт хайх холбоос. */
export function CharLinks({ zh }: { zh: string }) {
  const chars = Array.from(zh);
  return (
    <div className="flex flex-wrap gap-1.5" translate="no">
      {chars.map((ch, i) =>
        HAN_RE.test(ch) ? (
          <Link
            key={`${ch}-${i}`}
            href={`/dictionary?q=${encodeURIComponent(ch)}`}
            className="hanzi flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl font-bold text-[var(--app-text)] ring-1 ring-slate-200 active:bg-slate-50"
          >
            {ch}
          </Link>
        ) : null
      )}
    </div>
  );
}

function ExternalLink({ href, locale }: { href: string; locale: UiLocale }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="app-btn-secondary mt-4 inline-flex items-center gap-1 px-4 text-sm"
    >
      {L(locale, "在维基词典查看", "Wiktionary дээр үзэх")} ↗
    </a>
  );
}

type Props = {
  item: Idiom;
  kind: IdiomKind;
  locale: UiLocale;
  /** Утасны бүтэн хуудас — crumbs харуулна. PC-ийн баруун самбарт false. */
  showCrumbs?: boolean;
};

/** Нэг хэлц/зүйр үгийн дэлгэрэнгүй — утасны хуудас болон PC-ийн баруун самбар хоёулаа. */
export function IdiomDetail({ item: x, kind, locale, showCrumbs = true }: Props) {
  const kl = IDIOM_KINDS.find((k) => k.key === kind) ?? IDIOM_KINDS[0];
  return (
    <>
      {showCrumbs ? (
        <BookCrumbs
          items={[
            { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
            { href: idiomListHref({ kind }), label: L(locale, kl.zh, kl.mn) },
            { label: x.zh },
          ]}
        />
      ) : null}

      <section className="app-card p-5" translate="no">
        <div className="flex items-start justify-between gap-3">
          <h1 className="hanzi text-3xl font-bold leading-tight text-[var(--app-text)]">{x.zh}</h1>
          <LevelBadge level={x.level} />
        </div>
        <p className="mt-1 text-base text-[var(--app-muted)]">
          {x.pinyin_syllables ?? x.pinyin}
          {x.pinyin_check ? <span className="ml-1 text-[10px] text-amber-600">⚠ 拼音待校</span> : null}
        </p>
        {x.zh_trad && x.zh_trad !== x.zh ? (
          <p className="hanzi mt-0.5 text-xs text-[var(--app-muted)]">{x.zh_trad}</p>
        ) : null}

        {x.mn ? (
          <div className="mt-3 space-y-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
            <p className="text-sm font-bold text-emerald-900">💡 {x.mn.keyMn}</p>

            <div className="space-y-1.5 text-sm leading-6 text-[var(--app-text)]">
              <p>
                <span className="font-semibold">Үгчилбэл:</span> {x.mn.literalMn}
              </p>
              <p>
                <span className="font-semibold">Утгачилбал:</span> {x.mn.meaningMn}
              </p>
            </div>

            <p className="text-sm leading-6 text-[var(--app-text)]">
              <span className="font-semibold">Гарал үүсэл:</span> {x.mn.originMn}
            </p>

            <p className="text-sm leading-6 text-[var(--app-text)]">
              <span className="font-semibold">Хэзээ хэлдэг вэ:</span> {x.mn.usageMn}
            </p>

            {x.mn.exampleZh ? (
              <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100" translate="no">
                <p className="hanzi text-base text-[var(--app-text)]">{x.mn.exampleZh}</p>
                {x.mn.examplePinyin ? (
                  <p className="mt-0.5 text-xs text-[var(--app-muted)]">{x.mn.examplePinyin}</p>
                ) : null}
                {x.mn.exampleMn ? (
                  <p className="mt-1 text-sm text-[var(--app-text)]">— {x.mn.exampleMn}</p>
                ) : null}
              </div>
            ) : null}

            {x.mn.similarMn ? (
              <p className="text-sm leading-6 text-[var(--app-muted)]">
                <span className="font-semibold">Монгол зүйрлэл:</span> {x.mn.similarMn}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[var(--app-muted)]">
            {L(locale, "蒙古语翻译将在老师审核后逐步加入。", "Монгол орчуулга удахгүй нэмэгдэнэ.")}
          </p>
        )}

        {x.en.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--app-text)]">
            {x.en.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : null}

        {x.literal ? (
          <p className="mt-3 text-sm leading-6 text-[var(--app-text)]">
            <span className="font-semibold">直译:</span> {x.literal}
          </p>
        ) : null}

        {x.etymology ? (
          <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
            <span className="font-semibold">出处:</span> {x.etymology}
          </p>
        ) : null}
      </section>

      {x.source_quotes && x.source_quotes.length > 0 ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">
            {L(locale, "书证", "Эх бичвэрийн жишээ")}
          </h2>
          <div className="space-y-2" translate="no">
            {x.source_quotes.map((sq, i) => (
              <blockquote
                key={i}
                className="app-card border-l-4 border-emerald-500 p-4 text-sm leading-6 text-[var(--app-text)]"
              >
                <p className="hanzi text-base">{sq.zh}</p>
                {sq.ref ? <p className="mt-1 text-xs text-[var(--app-muted)]">— {sq.ref}</p> : null}
                {sq.en ? <p className="mt-1 text-xs text-[var(--app-muted)]">{sq.en}</p> : null}
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">{L(locale, "汉字", "Ханз")}</h2>
        <CharLinks zh={x.zh} />
      </section>

      {x.source_url ? <ExternalLink href={x.source_url} locale={locale} /> : null}

      <SourceNote>Wiktionary (CC BY-SA 4.0, en.wiktionary.org) via kaikki.org</SourceNote>
    </>
  );
}
