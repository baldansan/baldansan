"use client";

/**
 * Бичих дасгал: ханз бүрд 👀 хар → ✍️ дагаж ×N → 🧠 санаж ×M.
 * Ахиц дэвтэрт (локал/сервер) хадгалагдана; санаж бичих дууссан ханз бичих
 * SRS-д үнэлэгдэж, алдсан бол давталтад буцаж ирнэ.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MobileCard } from "@/components/mobile/mobile-card";
import { WordPartsLine } from "@/components/review/word-parts-line";
import { SpeakerButton } from "@/components/tts/speaker-button";
import type { WritingPadPhase, WritingPadResult } from "@/components/writing/writing-pad";
import { completeWritingAssignment } from "@/lib/classroom/assignment-completion";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import { KID_MODE_STORAGE_KEY } from "@/lib/kids/types";
import { recordWritingResult } from "@/lib/srs/writing-srs-sync";
import { getList, getProgress, saveProgress } from "@/lib/writing/store";
import {
  isCharDone,
  summarizeProgress,
  type WritingCharProgress,
  type WritingItem,
  type WritingList,
  type WritingProgressMap,
} from "@/lib/writing/types";
import "@/components/lesson/lesson-player.css";
import "@/components/writing/writing.css";

const WritingPad = dynamic(
  () => import("@/components/writing/writing-pad").then((m) => m.WritingPad),
  { ssr: false, loading: () => <p className="bs-srs-stroke-loading">Ачааллаж байна…</p> }
);

const KIDS_CHUNK = 5;
const SAVE_DEBOUNCE_MS = 600;
const FEEDBACK_MS = 850;

type Props = {
  listId: string;
  /** Энэ ханзнаас эхэлнэ (дэвтрийн мөр дээр дарсан). */
  startChar?: string | null;
  /** Дууссан ханзыг ч дахин бичнэ. */
  again?: boolean;
};

type Step = { phase: WritingPadPhase; index: number; total: number; base: number };

type CharResult = { ch: string; mistakes: number; done: boolean };

function readKidMode(): boolean {
  try {
    return Boolean(window.localStorage.getItem(KID_MODE_STORAGE_KEY));
  } catch {
    return false;
  }
}

/** Ханзны энэ удаагийн алхмууд: хар → дагаж ×k → санаж ×m. */
function buildSteps(
  list: WritingList,
  p: WritingCharProgress | undefined,
  fromScratch: boolean
): Step[] {
  const traceDone = fromScratch ? 0 : Math.min(p?.traceDone ?? 0, list.repsTrace);
  const memoryDone = fromScratch ? 0 : Math.min(p?.memoryDone ?? 0, list.repsMemory);
  let k = list.repsTrace - traceDone;
  let m = list.repsMemory - memoryDone;
  let baseT = traceDone;
  let baseM = memoryDone;
  if (k <= 0 && m <= 0) {
    k = list.repsTrace;
    m = list.repsMemory;
    baseT = 0;
    baseM = 0;
  }
  const steps: Step[] = [{ phase: "watch", index: 0, total: 1, base: 0 }];
  for (let i = 0; i < k; i += 1) steps.push({ phase: "trace", index: i, total: list.repsTrace, base: baseT });
  for (let i = 0; i < m; i += 1) steps.push({ phase: "memory", index: i, total: list.repsMemory, base: baseM });
  return steps;
}

export function WritingPracticeClient({ listId, startChar = null, again = false }: Props) {
  const locale = useUiLocale();
  const [list, setList] = useState<WritingList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kids] = useState(() => (typeof window === "undefined" ? false : readKidMode()));
  const [screen, setScreen] = useState<"loading" | "run" | "end" | "empty">("loading");

  const progressRef = useRef<WritingProgressMap>({});
  const pendingRef = useRef<Map<string, WritingCharProgress>>(new Map());
  const saveTimerRef = useRef<number | null>(null);

  const [queue, setQueue] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [si, setSi] = useState(0);
  const [fromScratch, setFromScratch] = useState(again);
  const [padKey, setPadKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [results, setResults] = useState<CharResult[]>([]);
  const sessionRef = useRef<{ mistakes: number; usedHint: boolean }>({ mistakes: 0, usedHint: false });
  const advanceTimerRef = useRef<number | null>(null);

  const itemByCh = useMemo(() => {
    const map = new Map<string, WritingItem>();
    for (const it of list?.items ?? []) map.set(it.ch, it);
    return map;
  }, [list]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const rows = [...pendingRef.current.values()];
    pendingRef.current.clear();
    if (rows.length > 0) void saveProgress(listId, rows);
  }, [listId]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => () => flushSave(), [flushSave]);
  useEffect(
    () => () => {
      if (advanceTimerRef.current != null) window.clearTimeout(advanceTimerRef.current);
    },
    []
  );

  /** Дараалал үүсгэж дасгалыг эхлүүлнэ. */
  const startSession = useCallback(
    (l: WritingList, chars: string[], scratch: boolean, isKids: boolean) => {
      if (chars.length === 0) {
        setScreen("empty");
        return;
      }
      const chunk = isKids ? chars.slice(0, KIDS_CHUNK) : chars;
      setQueue(chunk);
      setRemaining(isKids ? chars.slice(KIDS_CHUNK) : []);
      setQi(0);
      setFromScratch(scratch);
      setSteps(buildSteps(l, progressRef.current[chunk[0]!], scratch));
      setSi(0);
      setCompleted([]);
      setResults([]);
      sessionRef.current = { mistakes: 0, usedHint: false };
      setPadKey((k) => k + 1);
      setScreen("run");
    },
    []
  );

  useEffect(() => {
    let alive = true;
    const isKids = kids;
    void (async () => {
      const res = await getList(listId);
      if (!alive) return;
      if (res.error || !res.data) {
        setError(res.error ?? "Дэвтэр олдсонгүй.");
        setScreen("empty");
        return;
      }
      const l = res.data;
      const progress = await getProgress(listId);
      if (!alive) return;
      progressRef.current = progress;
      setList(l);
      const all = l.items.map((i) => i.ch);
      let base: string[];
      if (startChar && all.includes(startChar)) {
        const idx = all.indexOf(startChar);
        base = all.slice(idx).filter((ch) => ch === startChar || again || !isCharDone(l, progress[ch]));
      } else {
        base = again ? all : all.filter((ch) => !isCharDone(l, progress[ch]));
      }
      startSession(l, base, again, isKids);
    })();
    return () => {
      alive = false;
    };
  }, [listId, startChar, again, startSession, kids]);

  const ch = queue[qi] ?? null;
  const item = ch ? itemByCh.get(ch) ?? null : null;
  const step = steps[si] ?? null;

  function bumpProgress(c: string, patch: (p: WritingCharProgress) => WritingCharProgress) {
    const prev: WritingCharProgress = progressRef.current[c] ?? {
      ch: c,
      traceDone: 0,
      memoryDone: 0,
      mistakes: 0,
      completedAt: null,
      updatedAt: new Date().toISOString(),
    };
    const next = { ...patch(prev), updatedAt: new Date().toISOString() };
    progressRef.current = { ...progressRef.current, [c]: next };
    pendingRef.current.set(c, next);
    scheduleSave();
    return next;
  }

  function goNext() {
    if (!list || !ch) return;
    if (si < steps.length - 1) {
      setSi(si + 1);
      setPadKey((k) => k + 1);
      return;
    }
    // Ханз дууслаа.
    const hadMemory = steps.some((s) => s.phase === "memory");
    const p = progressRef.current[ch];
    const doneNow = isCharDone(list, p);
    if (hadMemory) {
      recordWritingResult(
        { key: ch, pinyin: item?.pinyin ?? null, meaning: item?.meaning_mn ?? null },
        { mistakes: sessionRef.current.mistakes, usedHint: sessionRef.current.usedHint }
      );
    }
    if (doneNow && !p?.completedAt) {
      bumpProgress(ch, (prev) => ({ ...prev, completedAt: new Date().toISOString() }));
    }
    const nextResults = [...results, { ch, mistakes: sessionRef.current.mistakes, done: doneNow }];
    setResults(nextResults);
    setCompleted((prev) => [...prev, ch]);
    sessionRef.current = { mistakes: 0, usedHint: false };

    const summary = summarizeProgress(list, progressRef.current);
    if (list.assignmentId && summary.cellsTotal > 0 && summary.cellsDone >= summary.cellsTotal) {
      const totalMistakes = Object.values(progressRef.current).reduce((n, r) => n + r.mistakes, 0);
      void completeWritingAssignment(list.assignmentId, {
        charsTotal: summary.charsTotal,
        mistakes: totalMistakes,
      });
    }

    if (qi < queue.length - 1) {
      const nextCh = queue[qi + 1]!;
      setQi(qi + 1);
      setSteps(buildSteps(list, progressRef.current[nextCh], fromScratch));
      setSi(0);
      setPadKey((k) => k + 1);
    } else {
      flushSave();
      setScreen("end");
    }
  }

  function handlePadDone(result: WritingPadResult) {
    if (!step || !ch || !list) return;
    if (step.phase === "watch") return;
    if (step.phase === "trace") {
      bumpProgress(ch, (prev) => ({ ...prev, traceDone: prev.traceDone + 1 }));
    } else {
      sessionRef.current.mistakes += result.mistakes;
      sessionRef.current.usedHint = sessionRef.current.usedHint || result.usedHint;
      bumpProgress(ch, (prev) => ({
        ...prev,
        memoryDone: prev.memoryDone + 1,
        mistakes: prev.mistakes + result.mistakes,
      }));
    }
    setFeedback(
      result.mistakes === 0
        ? kids
          ? `🌟 ${tr(locale, "Гоё!")}`
          : `✓ ${tr(locale, "Зөв бичлээ")}`
        : `👍 ${tr(locale, "Болсон")} · ${result.mistakes} ${tr(locale, "алдаа")}`
    );
    if (advanceTimerRef.current != null) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      goNext();
    }, FEEDBACK_MS);
  }

  function nextChunk() {
    if (!list) return;
    startSession(list, remaining, fromScratch, kids);
  }

  function restart() {
    if (!list) return;
    startSession(list, results.map((r) => r.ch), true, kids);
  }

  const stepLabel = (s: Step) => {
    if (s.phase === "watch") return `👀 ${tr(locale, "Хар")}`;
    if (s.phase === "trace") return `✍️ ${tr(locale, "Дагаж")} ${s.base + s.index + 1}/${s.total}`;
    return `🧠 ${tr(locale, "Санаж")} ${s.base + s.index + 1}/${s.total}`;
  };

  const shell = (children: React.ReactNode) => (
    <MobileAppShell activeTab="study" showBottomNav={false}>
      {children}
    </MobileAppShell>
  );

  if (screen === "loading") {
    return shell(
      <MobileCard>
        <p className="text-sm text-[var(--app-muted)]">{tr(locale, "Ачааллаж байна…")}</p>
      </MobileCard>
    );
  }

  if (screen === "empty" || !list) {
    return shell(
      <MobileCard padding="lg">
        <p className="text-sm text-[var(--app-text)]">
          {error ?? tr(locale, "Бүх ханз бичигдсэн байна — «Дахин бичих» дарж дахин дасгал хий.")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/writing/${listId}`} className="app-btn-primary">
            {tr(locale, "Дэвтэр рүү")}
          </Link>
          {!error ? (
            <Link
              href={`/writing/${listId}/practice?again=1`}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              🔁 {tr(locale, "Дахин бичих")}
            </Link>
          ) : null}
        </div>
      </MobileCard>
    );
  }

  if (screen === "end") {
    const totalMistakes = results.reduce((n, r) => n + r.mistakes, 0);
    return shell(
      <div className="pb-8">
        <MobileCard padding="lg" className="mb-4 text-center">
          <p className={kids ? "text-5xl" : "text-3xl"}>{totalMistakes === 0 ? "🏆" : "🎉"}</p>
          <p className="mt-2 text-lg font-bold text-[var(--app-text)]">
            {results.length} {tr(locale, "ханз бичлээ")}
          </p>
          <p className="text-sm text-[var(--app-muted)]">
            {totalMistakes === 0
              ? tr(locale, "Алдаагүй! Маш сайн.")
              : `${totalMistakes} ${tr(locale, "алдаа")} · ${tr(locale, "алдсан ханз давталтад буцаж ирнэ")}`}
          </p>
        </MobileCard>

        <MobileCard padding="sm" className="mb-4 !p-0">
          <table className="w-full text-sm">
            <thead className="text-xs text-[var(--app-muted)]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{tr(locale, "Ханз")}</th>
                <th className="px-3 py-2 text-left font-semibold">{tr(locale, "алдаа")}</th>
                <th className="px-3 py-2 text-right font-semibold">✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r.ch}>
                  <td className="px-3 py-2 text-2xl font-semibold text-[var(--app-text)]" translate="no">
                    {r.ch}
                    <span className="ml-2 align-middle text-xs font-normal text-[var(--app-muted)]" translate="no">
                      {itemByCh.get(r.ch)?.pinyin ?? ""}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--app-text)]">
                    {r.mistakes === 0 ? "—" : r.mistakes}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.done ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="text-slate-400">…</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </MobileCard>

        <div className="flex flex-col gap-2">
          {kids && remaining.length > 0 ? (
            <button type="button" onClick={nextChunk} className="app-btn-primary w-full">
              ▶ {tr(locale, "Дараагийн 5")} ({Math.min(KIDS_CHUNK, remaining.length)})
            </button>
          ) : null}
          <Link href={`/writing/${listId}`} className={`${kids && remaining.length > 0 ? "" : "app-btn-primary"} w-full rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200`}>
            📓 {tr(locale, "Дэвтэр рүү")}
          </Link>
          <button
            type="button"
            onClick={restart}
            className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            🔁 {tr(locale, "Дахин бичих")}
          </button>
        </div>
      </div>
    );
  }

  if (!ch || !step) return shell(null);

  const memoryPhase = step.phase === "memory";

  return shell(
    <div className="pb-6">
      <div className="mb-2 flex items-center gap-3 pr-28">
        <Link
          href={`/writing/${listId}`}
          className="inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
        >
          {tr(locale, "← Дэвтэр рүү")}
        </Link>
        <p className="text-xs font-bold text-[var(--app-muted)]">
          {qi + 1}/{queue.length} {tr(locale, "ханз")}
          {remaining.length > 0 ? ` · +${remaining.length}` : ""}
        </p>
      </div>

      <MobileCard className="mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex shrink-0 items-center justify-center rounded-2xl font-semibold ${
              kids ? "h-20 w-20 text-5xl" : "h-16 w-16 text-4xl"
            } ${memoryPhase ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200" : "bg-slate-50 text-[var(--app-text)] ring-1 ring-slate-200"}`}
            translate="no"
          >
            {memoryPhase ? "❓" : ch}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-[var(--app-text)]" translate="no">
              {item?.pinyin ?? ""}
            </p>
            <p className="text-sm text-[var(--app-muted)]" translate="no">
              {item?.meaning_mn ?? ""}
            </p>
            {item?.word && item.word !== ch && !memoryPhase ? (
              <p className="text-xs text-[var(--app-muted)]" translate="no">
                {item.word}
              </p>
            ) : null}
          </div>
          <SpeakerButton
            text={item?.word && !memoryPhase ? item.word : ch}
            lang="zh"
            size="sm"
            label={tr(locale, "Дуудлага сонсох")}
            showInlineError={false}
          />
        </div>
        {item?.word && item.word !== ch && !memoryPhase ? (
          <WordPartsLine text={item.word} className="mt-2" />
        ) : null}
      </MobileCard>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-1 text-[11px] font-bold">
        {(["watch", "trace", "memory"] as WritingPadPhase[]).map((phase, i) => {
          // Үе шат бүрийг нэг чипээр: идэвхтэй бол одоогийн тоотой, үгүй бол эхнийх.
          const firstIdx = steps.findIndex((x) => x.phase === phase);
          if (firstIdx < 0) return null;
          const active = phase === step.phase;
          const passed = !active && firstIdx < si;
          const shown = active ? step : steps[firstIdx]!;
          return (
            <span key={phase} className="flex items-center gap-1">
              {i > 0 ? <span className="text-slate-300">→</span> : null}
              <span
                className={`rounded-full px-2.5 py-1 ${
                  active
                    ? phase === "memory"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                    : passed
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {stepLabel(shown)}
              </span>
            </span>
          );
        })}
      </div>

      <div className="relative mx-auto w-full max-w-[340px]">
        <WritingPad key={padKey} char={ch} phase={step.phase} onDone={handlePadDone} maxSize={340} />
        {feedback ? (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <span
              className={`inline-block rounded-full bg-white/95 px-5 py-2 font-bold text-emerald-700 shadow-lg ring-1 ring-emerald-200 ${
                kids ? "text-2xl" : "text-base"
              }`}
            >
              {feedback}
            </span>
          </div>
        ) : null}
      </div>

      {step.phase === "watch" ? (
        <button type="button" onClick={goNext} className="app-btn-primary mt-4 w-full">
          {tr(locale, "Дараах")} → ✍️ {tr(locale, "Дагаж бичих")}
        </button>
      ) : (
        <p className="mt-3 text-center text-xs text-[var(--app-muted)]">
          {memoryPhase
            ? tr(locale, "Жишээгүй — санаж бич. Хэцүү бол сануулга авч болно.")
            : tr(locale, "Саарал зураасыг дагаж бич.")}
        </p>
      )}

      {kids && completed.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5" translate="no">
          {completed.map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-lg font-semibold text-amber-800 ring-1 ring-amber-200"
            >
              {c}
            </span>
          ))}
          <span className="flex h-9 items-center text-lg">⭐</span>
        </div>
      ) : null}
    </div>
  );
}
