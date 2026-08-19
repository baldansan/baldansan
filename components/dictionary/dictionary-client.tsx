"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { DrawInputSheet } from "@/components/dictionary/draw-input-sheet";
import { ConfusableChars } from "@/components/hanzi/confusable-chars";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";

type DictionaryWord = {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string | null;
  pos: string | null;
  radical: string | null;
  frequency: number | null;
  hsk_level: string | number | null;
  hsk_old: string | number | null;
  meaning_en: string | null;
  meaning_mn: string | null;
  example_zh: string | null;
  example_pinyin: string | null;
  example_mn: string | null;
};

const SEARCH_DEBOUNCE_MS = 350;

const EXAMPLES = ["爱情", "xuéxí", "сурах", "уух", "谢谢"];

/** Түгээмэл язгуурууд — «язгуураар үзэх» товчлуурууд. */
const COMMON_RADICALS: { r: string; mn: string }[] = [
  { r: "氵", mn: "ус" },
  { r: "亻", mn: "хүн" },
  { r: "口", mn: "ам" },
  { r: "扌", mn: "гар" },
  { r: "心", mn: "зүрх" },
  { r: "木", mn: "мод" },
  { r: "艹", mn: "өвс" },
  { r: "宀", mn: "дээвэр" },
  { r: "讠", mn: "үг" },
  { r: "辶", mn: "явах" },
  { r: "女", mn: "эмэгтэй" },
  { r: "日", mn: "нар" },
  { r: "月", mn: "сар · мах" },
  { r: "火", mn: "гал" },
  { r: "土", mn: "шороо" },
  { r: "钅", mn: "төмөр" },
  { r: "纟", mn: "утас" },
  { r: "⺮", mn: "хулс" },
  { r: "雨", mn: "бороо" },
  { r: "虫", mn: "шавж" },
];

function levelBadge(word: DictionaryWord): string | null {
  const level = word.hsk_level;
  if (level == null || level === "") return null;
  return `HSK ${level}`;
}

function ResultRow({ word }: { word: DictionaryWord }) {
  const locale = useUiLocale();
  const [open, setOpen] = useState(false);
  const badge = levelBadge(word);
  const meaning = word.meaning_mn || word.meaning_en || "";
  const hasExample = Boolean(word.example_zh);
  const showTraditional =
    word.traditional && word.traditional !== word.simplified;

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-white">
      <button
        type="button"
        onClick={() => hasExample && setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-bold text-[var(--app-text)]">
              {word.simplified}
            </span>
            {showTraditional ? (
              <span className="text-sm text-slate-400">{word.traditional}</span>
            ) : null}
            <span className="text-sm font-semibold text-emerald-700">
              {word.pinyin}
            </span>
          </span>
          <span className="mt-0.5 block text-sm text-[var(--app-muted)]">
            {meaning}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {badge ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                {badge}
              </span>
            ) : null}
            {word.pos ? (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                {word.pos}
              </span>
            ) : null}
            {hasExample ? (
              <span className="text-[10px] text-slate-400">
                {tr(locale, open ? "жишээ хаах ▴" : "жишээ ▾")}
              </span>
            ) : null}
          </span>
        </span>
        <SpeakerButton
          text={word.simplified}
          lang="zh-CN"
          hskLevel={word.hsk_level != null ? String(word.hsk_level) : undefined}
          size="sm"
          showInlineError={false}
          stopPropagation
        />
      </button>

      {open && hasExample ? (
        <div className="border-t border-[var(--app-border)] px-4 py-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-[var(--app-text)]">
                {word.example_zh}
              </p>
              {word.example_pinyin ? (
                <p className="mt-0.5 text-xs text-emerald-700">
                  {word.example_pinyin}
                </p>
              ) : null}
              {word.example_mn ? (
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                  {word.example_mn}
                </p>
              ) : null}
            </div>
            {word.example_zh ? (
              <SpeakerButton
                text={word.example_zh}
                lang="zh-CN"
                size="sm"
                showInlineError={false}
                stopPropagation
              />
            ) : null}
          </div>
          <ConfusableChars text={word.simplified} />
        </div>
      ) : null}
    </div>
  );
}

export function DictionaryClient() {
  const locale = useUiLocale();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [radical, setRadical] = useState<string | null>(null);
  const [results, setResults] = useState<DictionaryWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const requestIdRef = useRef(0);

  // /dictionary?q=清 маягийн шууд линк (андуурагдах ханзны чипээс)
  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) setQuery(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 && !radical) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      try {
        const url =
          q.length >= 1
            ? `/api/dictionary/search?q=${encodeURIComponent(q)}`
            : `/api/dictionary/search?radical=${encodeURIComponent(radical ?? "")}`;
        const res = await fetch(url);
        const payload = (await res.json()) as {
          results?: DictionaryWord[];
          error?: string;
        };
        if (requestId !== requestIdRef.current) return;
        if (!res.ok || payload.error) {
          setError(payload.error ?? "Хайлтад алдаа гарлаа");
          setResults([]);
        } else {
          setError(null);
          setResults(payload.results ?? []);
        }
        setSearched(true);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError("Сүлжээний алдаа — дахин оролдоно уу");
        setResults([]);
        setSearched(true);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, radical]);

  return (
    <MobileAppShell activeTab="kanji" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title={`${tr(locale, "Толь бичиг")} 📖`}
        subtitle={tr(locale, "Ханз · пиньинь · монгол утгаар хайх")}
      />

      <div className="mb-3 flex gap-2">
        <input
          type="search"
          autoFocus
          lang="zh-Hans"
          placeholder="爱 / ai / хайр …"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim()) setRadical(null);
          }}
          className="min-w-0 flex-1 rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-base outline-none ring-emerald-500 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => setDrawOpen(true)}
          aria-label={tr(locale, "Зурж хайх")}
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white shadow-sm"
        >
          ✍️
        </button>
      </div>

      <DrawInputSheet
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        onPick={(char) => {
          setRadical(null);
          setQuery((q) => `${q.trim()}${char}`);
        }}
      />

      {!searched && !loading ? (
        <MobileCard>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            {tr(locale, "Юугаар ч хайж болно:")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--app-muted)]">
            <li>• {tr(locale, "Ханзаар — 爱情")}</li>
            <li>• {tr(locale, "Пиньиньгээр — ai, xuexi (аялгагүй ч болно)")}</li>
            <li>• {tr(locale, "Монголоор — хайр, сурах")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="app-chip"
              >
                {ex}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-[var(--app-text)]">
            🧩 {tr(locale, "Язгуураар үзэх")}:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMMON_RADICALS.map((item) => (
              <button
                key={item.r}
                type="button"
                onClick={() => {
                  setQuery("");
                  setRadical(item.r);
                }}
                className="inline-flex items-baseline gap-1 rounded-xl bg-white px-2.5 py-1.5 text-sm ring-1 ring-slate-200"
              >
                <span className="font-bold">{item.r}</span>
                <span className="text-[10px] text-slate-500">{item.mn}</span>
              </button>
            ))}
          </div>
        </MobileCard>
      ) : null}

      {radical && !loading && !query.trim() ? (
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {radical} {COMMON_RADICALS.find((x) => x.r === radical)?.mn ?? ""} ·{" "}
            {results.length} {tr(locale, "үг")}
          </p>
          <button
            type="button"
            onClick={() => setRadical(null)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
          >
            ✕ {tr(locale, "Хаах")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="py-4 text-center text-sm text-[var(--app-muted)]">
          {tr(locale, "Хайж байна…")}
        </p>
      ) : null}

      {error ? (
        <MobileCard className="text-center">
          <p className="text-sm text-rose-600">{tr(locale, error)}</p>
        </MobileCard>
      ) : null}

      {!loading && searched && !error && results.length === 0 ? (
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            &laquo;{query.trim()}&raquo; {tr(locale, "олдсонгүй. Өөр үгээр хайгаад үзээрэй.")}
          </p>
        </MobileCard>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-2 pb-6">
          {results.map((word) => (
            <ResultRow key={word.id} word={word} />
          ))}
        </div>
      ) : null}
    </MobileAppShell>
  );
}
