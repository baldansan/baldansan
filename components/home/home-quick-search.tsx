"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

/**
 * Нүүрний хурдан хайлт (Pleco маягийн): бичиж эхлэнгүүт ханз / пиньинь /
 * монгол утгаар дээд 8 үр дүн dropdown-д. Толь бичгийн /api/dictionary/search
 * API-г дахин ашиглана; үр дүн дээр дарвал /dictionary?q=… руу.
 */

type QuickWord = {
  id: number;
  simplified: string;
  pinyin: string | null;
  meaning_mn: string | null;
  meaning_en: string | null;
  hsk_level: string | number | null;
};

const DEBOUNCE_MS = 150;
const LIMIT = 8;

function dictionaryHref(word: QuickWord): string {
  return `/dictionary?q=${encodeURIComponent(word.simplified)}`;
}

export function HomeQuickSearch() {
  const locale = useUiLocale();
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickWord[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const requestIdRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) return;
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dictionary/search?q=${encodeURIComponent(q)}&limit=${LIMIT}`
        );
        const payload = (await res.json()) as { results?: QuickWord[] };
        if (requestId !== requestIdRef.current) return;
        setResults(res.ok ? (payload.results ?? []).slice(0, LIMIT) : []);
        setActive(-1);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Гадна дарвал хаана
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (word: QuickWord | null) => {
    const q = query.trim();
    if (word) router.push(dictionaryHref(word));
    else if (q) router.push(`/dictionary?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active >= 0 ? (results[active] ?? null) : (results[0] ?? null));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative mb-3">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        {tr(locale, "Үг хайх")}
      </label>
      <div className="flex items-center gap-2 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-card)] px-3.5 py-2.5 shadow-[var(--app-shadow)] focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        <span aria-hidden className="text-base">
          🔍
        </span>
        <input
          id={`${listId}-input`}
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (next.trim().length === 0) {
              // Хоосон болбол хүлээгдэж буй хүсэлтийг хүчингүй болгоно
              requestIdRef.current += 1;
              setResults([]);
              setLoading(false);
              setActive(-1);
            }
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tr(locale, "Ханз, пиньинь, монгол үг хайх…")}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[var(--app-text)] outline-none placeholder:font-medium placeholder:text-[var(--app-muted)]"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-list`}
          aria-activedescendant={
            active >= 0 && results[active] ? `${listId}-opt-${results[active].id}` : undefined
          }
        />
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" aria-hidden />
        ) : null}
      </div>

      {showList ? (
        <ul
          id={`${listId}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[60vh] overflow-y-auto rounded-[18px] border border-[var(--app-border)] bg-[var(--app-card)] p-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.16)]"
        >
          {results.length === 0 && !loading ? (
            <li className="px-3 py-2.5 text-sm text-[var(--app-muted)]">
              {tr(locale, "Олдсонгүй")} — {tr(locale, "Enter дарж толь бичгээс хай")}
            </li>
          ) : null}
          {results.map((word, i) => (
            <li
              key={word.id}
              id={`${listId}-opt-${word.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(word)}
              className={`flex cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 ${
                i === active ? "bg-emerald-50" : ""
              }`}
            >
              <span className="hanzi shrink-0 text-xl font-bold text-[var(--app-text)]" lang="zh-CN" translate="no">
                {word.simplified}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-emerald-700" translate="no">
                  {word.pinyin ?? ""}
                </span>
                <span className="block truncate text-[13px] text-[var(--app-text)]">
                  {locale === "zh"
                    ? (word.meaning_en ?? word.meaning_mn ?? "")
                    : (word.meaning_mn ?? word.meaning_en ?? "")}
                </span>
              </span>
              {word.hsk_level != null ? (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  HSK {word.hsk_level}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
