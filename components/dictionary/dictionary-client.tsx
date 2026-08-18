"use client";

import { useEffect, useRef, useState } from "react";
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

function levelBadge(word: DictionaryWord): string | null {
  const level = word.hsk_level;
  if (level == null || level === "") return null;
  return `HSK ${level}`;
}

function ResultRow({ word }: { word: DictionaryWord }) {
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
                {open ? "жишээ хаах ▴" : "жишээ ▾"}
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
        </div>
      ) : null}
    </div>
  );
}

export function DictionaryClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DictionaryWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
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
        const res = await fetch(
          `/api/dictionary/search?q=${encodeURIComponent(q)}`
        );
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
  }, [query]);

  return (
    <MobileAppShell activeTab="kanji" mainClassName={SHELL_MAIN_NARROW}>
      <MobilePageHeader
        title="Толь бичиг 📖"
        subtitle="Ханз · пиньинь · монгол утгаар хайх"
      />

      <div className="mb-3">
        <input
          type="search"
          autoFocus
          placeholder="爱 / ai / хайр …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-[var(--app-border)] bg-white px-4 py-3 text-base outline-none ring-emerald-500 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2"
        />
      </div>

      {!searched && !loading ? (
        <MobileCard>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            Юугаар ч хайж болно:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--app-muted)]">
            <li>• Ханзаар — 爱情</li>
            <li>• Пиньиньгээр — ai, xuexi (аялгагүй ч болно)</li>
            <li>• Монголоор — хайр, сурах</li>
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
        </MobileCard>
      ) : null}

      {loading ? (
        <p className="py-4 text-center text-sm text-[var(--app-muted)]">
          Хайж байна…
        </p>
      ) : null}

      {error ? (
        <MobileCard className="text-center">
          <p className="text-sm text-rose-600">{error}</p>
        </MobileCard>
      ) : null}

      {!loading && searched && !error && results.length === 0 ? (
        <MobileCard className="text-center">
          <p className="text-sm text-[var(--app-muted)]">
            &laquo;{query.trim()}&raquo; олдсонгүй. Өөр үгээр хайгаад үзээрэй.
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
