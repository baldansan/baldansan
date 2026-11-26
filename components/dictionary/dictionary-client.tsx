"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { DrawInputSheet } from "@/components/dictionary/draw-input-sheet";
import { ConfusableChars } from "@/components/hanzi/confusable-chars";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { WordDetailPanel } from "@/components/dictionary/word-detail-panel";
import { ReportWrongButton } from "@/components/dictionary/report-wrong-button";
import { useIsDesktop } from "@/lib/use-is-desktop";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePageHeader } from "@/components/mobile/mobile-page-header";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { SHELL_MAIN_NARROW } from "@/lib/app-shell-classes";
import { SaveWordButton, type SaveState } from "@/components/dictionary/save-word-button";
import { WordSenses } from "@/components/dictionary/word-senses";
import { SavedWordsHint } from "@/components/review/saved-words-hint";
import {
  getSavedStatusForWords,
  removeWordFromStudy,
  saveWordFromLesson,
} from "@/lib/supabase/saved-words";

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
  /** CC-CEDICT лексиконы үг (id < 0); ai = монгол утга нь AI ноорог. */
  ai?: boolean;
  lexicon?: boolean;
};

const SEARCH_DEBOUNCE_MS = 220;
const RECENT_KEY = "bs-dict-recent";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* хувийн горимд localStorage хаалттай байж болно */
  }
}

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

function ResultRow({
  word,
  selected = false,
  onSelect,
  onOpen,
  save,
  onToggleSave,
}: {
  word: DictionaryWord;
  selected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
  save: SaveState;
  onToggleSave: () => void;
}) {
  const locale = useUiLocale();
  const [open, setOpen] = useState(false);
  const [richSenses, setRichSenses] = useState(false);
  const badge = levelBadge(word);
  const meaning = word.meaning_mn || word.meaning_en || "";
  const hasExample = Boolean(word.example_zh);
  const showTraditional =
    word.traditional && word.traditional !== word.simplified;

  return (
    <div className={`rounded-2xl border bg-white bs-dict-row${selected ? " bs-dict-row--on border-emerald-400 ring-2 ring-emerald-200" : " border-[var(--app-border)]"}`}>
      <div className="flex items-start gap-1 pr-2">
        <button
          type="button"
          onClick={() => {
            if (onSelect) onSelect();
            else {
              if (!open) onOpen?.();
              setOpen((v) => !v);
            }
          }}
          className="min-w-0 flex-1 px-4 py-3 text-left"
          aria-current={selected ? "true" : undefined}
          aria-expanded={onSelect ? undefined : open}
        >
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="hanzi text-2xl font-bold text-[var(--app-text)]">
              {word.simplified}
            </span>
            {showTraditional ? (
              <span className="hanzi text-sm text-slate-400">{word.traditional}</span>
            ) : null}
            <span className="text-sm font-semibold text-emerald-700">
              {word.pinyin}
            </span>
          </span>
          <span
            className={`mt-0.5 block text-sm text-[var(--app-muted)]${open ? "" : " bs-dict-clamp"}`}
            translate="no"
          >
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
            {!onSelect ? (
              <span className="text-[10px] text-slate-400">
                {tr(locale, open ? "хаах ▴" : "дэлгэрэнгүй ▾")}
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 pt-3">
          <SpeakerButton
            text={word.simplified}
            lang="zh-CN"
            hskLevel={word.hsk_level != null ? String(word.hsk_level) : undefined}
            size="sm"
            showInlineError={false}
            stopPropagation
          />
          <SaveWordButton variant="icon" state={save} onToggle={onToggleSave} />
        </div>
      </div>

      {open && !onSelect ? (
        <div className="border-t border-[var(--app-border)] px-4 py-3">
          {word.meaning_mn && word.meaning_en && !richSenses ? (
            <p className="mb-2 text-xs text-[var(--app-muted)]" translate="no">
              {word.meaning_en}
            </p>
          ) : null}
          {word.id > 0 ? <WordSenses wordId={word.id} onLoaded={setRichSenses} /> : null}
          {hasExample && !richSenses ? (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1" translate="no">
              <p className="hanzi text-base font-semibold text-[var(--app-text)]">
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
          ) : null}
          <div className="mt-3">
            <SaveWordButton variant="full" state={save} onToggle={onToggleSave} />
          </div>
          {hasExample ? <ConfusableChars text={word.simplified} /> : null}
          <ReportWrongButton wordId={word.id} simplified={word.simplified} currentMn={word.meaning_mn} />
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const desktop = useIsDesktop();
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [busyZh, setBusyZh] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  const rememberQuery = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, RECENT_MAX);
      writeRecent(next);
      return next;
    });
  }, []);

  // Үр дүн ирэх бүрд аль үг аль хэдийн хадгалагдсаныг нэг дор шалгана.
  useEffect(() => {
    let alive = true;
    getSavedStatusForWords(
      results.map((w) => ({ zh: w.simplified, hskWordId: w.id > 0 ? w.id : null }))
    )
      .then((r) => {
        if (!alive) return;
        setLoggedIn(r.loggedIn);
        setSavedSet(r.saved);
      })
      .catch(() => alive && setLoggedIn(false));
    return () => {
      alive = false;
    };
  }, [results]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function toggleSave(word: DictionaryWord) {
    const zh = word.simplified;
    if (busyZh) return;
    setBusyZh(zh);
    if (savedSet.has(zh)) {
      const r = await removeWordFromStudy(zh);
      if (r.ok) {
        setSavedSet((prev) => {
          const next = new Set(prev);
          next.delete(zh);
          return next;
        });
        setToast({ text: "Цээжлэх үгсээс хаслаа", ok: false });
      } else if (r.error) setToast({ text: r.error, ok: false });
    } else {
      const r = await saveWordFromLesson({
        zh,
        pinyin: word.pinyin ?? undefined,
        mn: word.meaning_mn ?? word.meaning_en ?? undefined,
      });
      if (r.ok) {
        setSavedSet((prev) => new Set(prev).add(zh));
        rememberQuery(query);
        setToast({
          text: r.isFunctionWord
            ? "Дүрмийн үг тул зөвхөн жагсаалтад хадгаллаа ✓"
            : "Цээжлэх үгсэд нэмлээ ✓",
          ok: true,
        });
      } else if (r.error) setToast({ text: r.error, ok: false });
    }
    setBusyZh(null);
  }

  const saveStateOf = (word: DictionaryWord): SaveState => ({
    loggedIn,
    saved: savedSet.has(word.simplified),
    busy: busyZh === word.simplified,
  });
  const selectedWord = results.find((w) => w.id === selectedId) ?? null;

  // PC: хайлтын үр дүн ирэхэд эхний үгийг автоматаар сонгоно
  useEffect(() => {
    if (!desktop) return;
    if (results.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!results.some((w) => w.id === selectedId)) setSelectedId(results[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, desktop]);

  // PC: ↑↓ товчоор үг солих
  useEffect(() => {
    if (!desktop || results.length === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "INPUT" && e.key === "ArrowUp") return;
      e.preventDefault();
      const i = results.findIndex((w) => w.id === selectedId);
      const next = e.key === "ArrowDown" ? Math.min(results.length - 1, i + 1) : Math.max(0, i - 1);
      setSelectedId(results[next]?.id ?? null);
      document.querySelector<HTMLElement>(`[data-word-id="${results[next]?.id}"]`)?.scrollIntoView({ block: "nearest" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktop, results, selectedId]);

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

  const trimmed = query.trim();
  const hskResults = results.filter((w) => w.id > 0);
  const lexResults = results.filter((w) => w.id < 0);

  const renderRow = (word: DictionaryWord) => (
    <div key={word.id} data-word-id={word.id}>
      <ResultRow
        word={word}
        selected={desktop && word.id === selectedId}
        onSelect={
          desktop
            ? () => {
                setSelectedId(word.id);
                rememberQuery(query);
              }
            : undefined
        }
        onOpen={() => rememberQuery(query)}
        save={saveStateOf(word)}
        onToggleSave={() => void toggleSave(word)}
      />
    </div>
  );

  return (
    <MobileAppShell activeTab="kanji" mainClassName={SHELL_MAIN_NARROW} desktopWidth="wide">
      <div className="bs-dict-two">
      <div className="bs-dict-list">
      <MobilePageHeader
        title={`${tr(locale, "Толь бичиг")} 📖`}
        subtitle={tr(locale, "Ханз · пиньинь · монгол · англиар хайх")}
      />

      <div className="bs-dict-searchbar">
        <div className="bs-dict-inputwrap">
          <span className="bs-dict-inputicon" aria-hidden>🔍</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            lang="zh-Hans"
            aria-label={tr(locale, "Толь бичгээс хайх")}
            placeholder={tr(locale, "爱 · ai · хайр · love")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) setRadical(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                rememberQuery(query);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="bs-dict-input"
          />
          {loading ? <span className="bs-dict-spin" aria-label={tr(locale, "Хайж байна…")} /> : null}
          {query && !loading ? (
            <button
              type="button"
              className="bs-dict-clear"
              aria-label={tr(locale, "Арилгах")}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setDrawOpen(true)}
          aria-label={tr(locale, "Зурж хайх")}
          className="bs-dict-drawbtn"
        >
          <span aria-hidden>✍️</span>
          <span className="bs-dict-drawbtn-label">{tr(locale, "Зурах")}</span>
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
        <>
        {recent.length > 0 ? (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--app-muted)]">🕘 {tr(locale, "Сүүлд хайсан")}</p>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--app-muted)] underline"
                onClick={() => {
                  setRecent([]);
                  writeRecent([]);
                }}
              >
                {tr(locale, "Арилгах")}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => setQuery(r)} className="app-chip" translate="no">
                  {r}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <MobileCard>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            {tr(locale, "Юугаар ч хайж болно:")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--app-muted)]">
            <li>• {tr(locale, "Ханзаар — 爱情")}</li>
            <li>• {tr(locale, "Пиньиньгээр — ai, xuexi (аялгагүй ч болно)")}</li>
            <li>• {tr(locale, "Монголоор — хайр, сурах")}</li>
            <li>• {tr(locale, "Англиар — love, study")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="app-chip"
                translate="no"
              >
                {ex}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--bs-green-700)]">
            ＋ {tr(locale, "Олсон үгийнхээ хажуугийн ＋ товчийг дарвал цээжлэх үгсэд чинь нэмэгдэнэ.")}
          </p>
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
                className="bs-dict-radical"
              >
                <span className="font-bold">{item.r}</span>
                <span className="text-[10px] text-[var(--app-muted)]" translate="no">{item.mn}</span>
              </button>
            ))}
          </div>
        </MobileCard>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/review/words" className="bs-lvw-entry !mb-0">
            <span>⭐ {tr(locale, "Миний үгс")}</span>
            <span className="bs-lvw-entry-sub">{tr(locale, "Хадгалсан үгээ давтах →")}</span>
          </Link>
          <Link href="/dictionary/levels" className="bs-lvw-entry !mb-0">
            <span>📚 {tr(locale, "HSK 1–6 бүх үг")}</span>
            <span className="bs-lvw-entry-sub">{tr(locale, "Түвшнээр үзэх →")}</span>
          </Link>
        </div>
        </>
      ) : null}

      {radical && !loading && !trimmed ? (
        <div className="mb-2 flex items-center gap-2">
          <p className="text-sm font-bold text-[var(--app-text)]">
            {radical} <span translate="no">{COMMON_RADICALS.find((x) => x.r === radical)?.mn ?? ""}</span> ·{" "}
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

      {loading && results.length === 0 ? (
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
        <MobileCard>
          <p className="text-sm font-semibold text-[var(--app-text)]">
            &laquo;<span translate="no">{trimmed}</span>&raquo; {tr(locale, "олдсонгүй.")}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--app-muted)]">
            <li>• {tr(locale, "Үгээ богиносгоод үз — жишээ нь зөвхөн үндсийг нь бич.")}</li>
            <li>• {tr(locale, "Монгол үгийг кирилл үсгээр бич (surah биш — сурах).")}</li>
            <li>• {tr(locale, "Ханзыг нь мэдэхгүй бол гараараа зурж хай.")}</li>
          </ul>
          <button type="button" className="bs-dict-save-full mt-3" onClick={() => setDrawOpen(true)}>
            ✍️ {tr(locale, "Зурж хайх")}
          </button>
        </MobileCard>
      ) : null}

      {results.length > 0 ? (
        <div className={`space-y-2 pb-6${loading ? " opacity-60" : ""}`}>
          {trimmed && hskResults.length > 0 ? (
            <p className="bs-dict-group">{tr(locale, "HSK үгс")} · {hskResults.length}</p>
          ) : null}
          {hskResults.map(renderRow)}
          {lexResults.length > 0 ? (
            <p className="bs-dict-group">{tr(locale, "Нэмэлт үгс")} · {lexResults.length}</p>
          ) : null}
          {lexResults.map(renderRow)}
        </div>
      ) : null}
      <p className="pb-6 pt-2 text-center text-[11px] leading-4 text-[var(--app-muted)]" translate="no">
        {tr(locale, "Нэмэлт үгсийн эх сурвалж: CC-CEDICT (MDBG), CC BY-SA 4.0.")}
      </p>
      </div>
      <aside className="bs-dict-detail bs-desk-only">
        <WordDetailPanel
          word={selectedWord}
          save={selectedWord ? saveStateOf(selectedWord) : undefined}
          onToggleSave={selectedWord ? () => void toggleSave(selectedWord) : undefined}
        />
      </aside>
      </div>
      {toast ? (
        <div className="bs-dict-toast" role="status">
          {toast.ok ? (
            <SavedWordsHint message={tr(locale, toast.text)} refreshKey={toast.text + savedSet.size} />
          ) : (
            <p className="text-xs font-semibold">{tr(locale, toast.text)}</p>
          )}
        </div>
      ) : null}
    </MobileAppShell>
  );
}
