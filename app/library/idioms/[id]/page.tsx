import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCrumbs, L } from "@/components/books/book-ui";
import { LevelBadge, SourceNote } from "@/components/library/library-ui";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import type { UiLocale } from "@/lib/i18n/locale-types";
import { getServerUiLocale } from "@/lib/i18n/server-locale";
import { getFables, getIdioms, type Fable, type Idiom, type IdiomKind } from "@/lib/library/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const KIND_LABEL: Record<IdiomKind, { zh: string; mn: string }> = {
  idioms: { zh: "成语", mn: "Хэлц үг" },
  proverbs: { zh: "谚语", mn: "Зүйр цэцэн үг" },
  xiehouyu: { zh: "歇后语", mn: "Ёгт хэллэг (歇后语)" },
};

type Found = { type: "idiom"; kind: IdiomKind; item: Idiom } | { type: "fable"; item: Fable };

async function findById(rawId: string): Promise<Found | null> {
  const id = decodeURIComponent(rawId);
  if (id.startsWith("fable-")) {
    const f = await getFables();
    const item = f.items.find((x) => x.id === id);
    return item ? { type: "fable", item } : null;
  }
  const kinds: IdiomKind[] = ["idioms", "proverbs", "xiehouyu"];
  for (const kind of kinds) {
    const items = await getIdioms(kind);
    const item = items.find((x) => x.id === id);
    if (item) return { type: "idiom", kind, item };
  }
  // Fallback: fables whose id doesn't start with "fable-" (defensive).
  const f = await getFables();
  const fable = f.items.find((x) => x.id === id);
  return fable ? { type: "fable", item: fable } : null;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const found = await findById(id);
  const zh = found ? (found.type === "fable" ? found.item.idiom : found.item.zh) : "成语";
  return { title: `${zh} — Бөөндөө Сурцгаая` };
}

const HAN_RE = /\p{Script=Han}/u;

/** Ханз тус бүр — толь бичигт хайх холбоос. */
function CharLinks({ zh }: { zh: string }) {
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
        ) : null,
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

/* ---------------- 成语 / 谚语 / 歇后语 ---------------- */

function IdiomDetail({ found, locale }: { found: Extract<Found, { type: "idiom" }>; locale: UiLocale }) {
  const x = found.item;
  const kl = KIND_LABEL[found.kind];
  return (
    <>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          {
            href: found.kind === "idioms" ? "/library/idioms" : `/library/idioms?kind=${found.kind}`,
            label: L(locale, kl.zh, kl.mn),
          },
          { label: x.zh },
        ]}
      />

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

/* ---------------- 寓言 ---------------- */

function FableDetail({ f, locale }: { f: Fable; locale: UiLocale }) {
  const meta = [f.book, f.chapter].filter(Boolean).join(" · ");
  return (
    <>
      <BookCrumbs
        items={[
          { href: "/library", label: L(locale, "文库", "Уншлагын сан") },
          { href: "/library/idioms?kind=fables", label: L(locale, "寓言", "Үлгэр (寓言)") },
          { label: f.idiom },
        ]}
      />
      <header className="mb-4" translate="no">
        <h1 className="hanzi text-2xl font-bold tracking-tight text-[var(--app-text)]">{f.title}</h1>
        <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
          {f.idiom}
          {meta ? ` · ${meta}` : ""}
        </p>
      </header>

      <ol className="space-y-3" translate="no">
        {f.sentences.map((s, i) => (
          <li key={i} className="app-card p-4">
            <p className="hanzi text-lg leading-8 text-[var(--app-text)]">{s.zh}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{s.pinyin}</p>
          </li>
        ))}
      </ol>

      <section className="mt-4">
        <h2 className="mb-2 text-sm font-bold text-[var(--app-text)]">{L(locale, "汉字", "Ханз")}</h2>
        <CharLinks zh={f.idiom} />
      </section>

      {f.source_url ? (
        <a
          href={f.source_url}
          target="_blank"
          rel="noreferrer"
          className="app-btn-secondary mt-4 inline-flex items-center gap-1 px-4 text-sm"
        >
          {L(locale, "在维基文库查看原文", "Wikisource дээр эхийг үзэх")} ↗
        </a>
      ) : null}

      <SourceNote>
        {f.source ?? "zh.wikisource.org (维基文库)"}
        {f.license ? ` · ${f.license}` : null}
        {" · "}
        {L(
          locale,
          "简体由 OpenCC 转换，拼音由程序生成，文言多音字待老师校对",
          "Хялбар ханзыг OpenCC-ээр хөрвүүлсэн; пиньинийг програм үүсгэсэн тул багш шалгана",
        )}
      </SourceNote>
    </>
  );
}

/* ---------------- Хуудас ---------------- */

export default async function LibraryIdiomDetailPage({ params }: Props) {
  const { id } = await params;
  const [locale, found] = await Promise.all([getServerUiLocale(), findById(id)]);
  if (!found) notFound();

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_NARROW}>
      {found.type === "fable" ? (
        <FableDetail f={found.item} locale={locale} />
      ) : (
        <IdiomDetail found={found} locale={locale} />
      )}
    </MobileAppShell>
  );
}
