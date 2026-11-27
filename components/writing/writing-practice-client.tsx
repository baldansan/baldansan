"use client";

/**
 * Бичих дасгал: ханз бүрд 👀 хар → ✍️ дагаж ×N → 🧠 санаж ×M.
 * Ханз бүр гурван шатаа ТАСРАЛТГҮЙ дуусгана: харж, дагаж бичээд тэр даруй нэг удаа санаж
 * бичнэ. Үлдсэн санаж бичилтийг багцын бусад ханзтай ээлжлүүлнэ (A, B, A, B…) — зай авч
 * давтахад толгой санана.
 * Санаж бичихдээ чадаагүй (сануулга авсан / олон алдсан) ханз алга болохгүй: загварыг нь
 * дахин дагаж бичүүлээд, хэдэн ханзны дараа дахин санаж бичүүлнэ.
 * Нэг удаад 10 ханз. Төгсгөлд нь тэр 10-ыг загваргүй, холимог дарааллаар шалгана —
 * шалгалтад чадаагүй ханзыг төгсгөлийн дэлгэц тусад нь харуулж, дахин бичүүлнэ.
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
import { markTodayHanzi } from "@/lib/today/today-path";
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
/** Нэг удаагийн дасгалын ханзны тоо — 67 ханзыг нэг амьсгаагаар биш, 10-аар. */
const CHUNK = 10;
/** Санаж бичихэд чадаагүй ханзыг хэдэн даалгаврын дараа дахин асуух вэ. */
const RETRY_GAP = 3;
/** Нэг ханзыг нэг дасгалд хэдэн удаа буцааж асуух вэ (эцэс төгсгөлгүй эргэлдэхгүй). */
const MAX_RETRY = 2;
const SAVE_DEBOUNCE_MS = 600;
const FEEDBACK_MS = 850;

type Props = {
  listId: string;
  /** Энэ ханзнаас эхэлнэ (дэвтрийн мөр дээр дарсан). */
  startChar?: string | null;
  /** Дууссан ханзыг ч дахин бичнэ. */
  again?: boolean;
  /** Хичээлийн төгсгөлөөс орж ирсэн бол тэр хичээлийн id — буцах товч хичээл рүү аваачна. */
  fromLessonId?: string | null;
};

type Step = { phase: WritingPadPhase; index: number; total: number; base: number };

/**
 * Дарааллын нэг даалгавар: аль ханз, аль алхам.
 * extra = дэвтрийн нүдэнд тоологдохгүй нэмэлт: "check" төгсгөлийн шалгалт, "retry" чадаагүй ханзыг буцаасан.
 */
type Task = Step & { ch: string; extra?: "check" | "retry" };

/** weak = хамгийн сүүлд санаж бичихдээ чадаагүй (дахин бичих хэрэгтэй). */
type CharResult = { ch: string; mistakes: number; done: boolean; weak: boolean };

/** Санаж бичилт «чадаагүй» гэж тооцогдох уу: сануулга авсан эсвэл 3+ удаа алдсан. */
function recallFailed(r: WritingPadResult): boolean {
  return r.usedHint || r.mistakes >= 3;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const GROUP_KEY = "bs:writingGroupSize";
const GROUP_DEFAULT = 2;
const GROUP_OPTIONS = [1, 2, 3, 4, 5];

function readGroupSize(): number {
  try {
    const n = Number(window.localStorage.getItem(GROUP_KEY));
    return GROUP_OPTIONS.includes(n) ? n : GROUP_DEFAULT;
  } catch {
    return GROUP_DEFAULT;
  }
}

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

/**
 * Бүх ханзны даалгаврыг нэг дараалал болгоно.
 * Багц бүрд: ханз бүр хар → дагаж → тэр даруй 1 удаа санаж; дараа нь үлдсэн санаж бичилтийг
 * ээлжлүүлнэ. Төгсгөлд (2+ ханзтай бол) бүгдийг загваргүй, холимог дарааллаар шалгана.
 * Зөвхөн client талд (effect / товч дарахад) дуудагдана — санамсаргүй дараалал render-т орохгүй.
 */
function buildTasks(
  list: WritingList,
  progress: WritingProgressMap,
  chars: string[],
  fromScratch: boolean,
  group: number
): Task[] {
  const per = (c: string): Task[] =>
    buildSteps(list, progress[c], fromScratch).map((st) => ({ ...st, ch: c }));
  const size = Math.max(1, group);
  const tasks: Task[] = [];
  for (let i = 0; i < chars.length; i += size) {
    const stepsBy = chars.slice(i, i + size).map(per);
    const later: Task[][] = [];
    // 1) Ханз бүр гурван шатаа дараалан: хар → дагаж → эхний санаж бичилт.
    for (const st of stepsBy) {
      const mem = st.filter((x) => x.phase === "memory");
      tasks.push(...st.filter((x) => x.phase !== "memory"));
      if (mem[0]) tasks.push(mem[0]);
      later.push(mem.slice(1));
    }
    // 2) Үлдсэн санаж бичилтийг ээлжлүүлнэ.
    const rounds = Math.max(0, ...later.map((m) => m.length));
    for (let r = 0; r < rounds; r += 1) {
      for (const m of later) if (m[r]) tasks.push(m[r]!);
    }
  }
  // 3) Төгсгөлийн шалгалт — загваргүй, холимог.
  if (chars.length > 1) {
    for (const c of shuffled(chars)) {
      tasks.push({ ch: c, phase: "memory", index: 0, total: 1, base: 0, extra: "check" });
    }
  }
  return tasks;
}

export function WritingPracticeClient({ listId, startChar = null, again = false, fromLessonId = null }: Props) {
  const lessonHref = fromLessonId ? `/lessons/${encodeURIComponent(fromLessonId)}` : null;
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ti, setTi] = useState(0);
  const [group, setGroup] = useState(GROUP_DEFAULT);
  const [fromScratch, setFromScratch] = useState(again);
  const [padKey, setPadKey] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [results, setResults] = useState<CharResult[]>([]);
  const sessionRef = useRef<Map<string, { mistakes: number; usedHint: boolean }>>(new Map());
  /** Хугацаатай шилжилт (feedback-ийн дараа) хуучин state барихгүйн тулд дарааллыг ref-д давхар хадгална. */
  const tasksRef = useRef<Task[]>([]);
  const tiRef = useRef(0);
  /** Ханз бүрийн хамгийн сүүлийн санаж бичилт чадсан уу. */
  const lastRecallOkRef = useRef<Map<string, boolean>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());
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
    (l: WritingList, chars: string[], scratch: boolean, isKids: boolean, groupSize?: number) => {
      if (chars.length === 0) {
        setScreen("empty");
        return;
      }
      const chunkSize = isKids ? KIDS_CHUNK : CHUNK;
      const chunk = chars.slice(0, chunkSize);
      // Хүүхдийн горим: нэг нэгээр (5-аар хэсэглэнэ). Бусад нь сонгосон багцаар.
      const g = isKids ? 1 : (groupSize ?? readGroupSize());
      setGroup(g);
      setQueue(chunk);
      setRemaining(chars.slice(chunkSize));
      setFromScratch(scratch);
      const built = buildTasks(l, progressRef.current, chunk, scratch, g);
      tasksRef.current = built;
      tiRef.current = 0;
      lastRecallOkRef.current = new Map();
      retryCountRef.current = new Map();
      setTasks(built);
      setTi(0);
      setCompleted([]);
      setResults([]);
      sessionRef.current = new Map();
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

  const step = tasks[ti] ?? null;
  const ch = step?.ch ?? null;
  const item = ch ? itemByCh.get(ch) ?? null : null;
  /** Одоогийн ханзны өөрийн алхмууд (холимог давталтыг оруулахгүй) — дээрх чипүүдэд. */
  const steps = useMemo(
    () => (ch ? tasks.filter((t) => t.ch === ch && !t.extra) : []),
    [tasks, ch]
  );

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
    if (!list || !ch || !step) return;
    const tasks = tasksRef.current;
    const ti = tiRef.current;
    const hasMore = tasks.slice(ti + 1).some((t) => t.ch === ch);
    let nextResults = results;
    if (!hasMore) {
      // Энэ ханзны бүх даалгавар дууслаа.
      const sess = sessionRef.current.get(ch) ?? { mistakes: 0, usedHint: false };
      const hadMemory = tasks.some((t) => t.ch === ch && t.phase === "memory");
      const p = progressRef.current[ch];
      const doneNow = isCharDone(list, p);
      if (hadMemory) {
        recordWritingResult(
          { key: ch, pinyin: item?.pinyin ?? null, meaning: item?.meaning_mn ?? null },
          { mistakes: sess.mistakes, usedHint: sess.usedHint }
        );
      }
      if (doneNow && !p?.completedAt) {
        bumpProgress(ch, (prev) => ({ ...prev, completedAt: new Date().toISOString() }));
      }
      const weak = hadMemory && lastRecallOkRef.current.get(ch) === false;
      nextResults = [...results, { ch, mistakes: sess.mistakes, done: doneNow, weak }];
      setResults(nextResults);
      setCompleted((prev) => [...prev, ch]);

      const summary = summarizeProgress(list, progressRef.current);
      if (summary.cellsTotal > 0 && summary.cellsDone >= summary.cellsTotal) {
        if (list.assignmentId) {
          const totalMistakes = Object.values(progressRef.current).reduce((n, r) => n + r.mistakes, 0);
          void completeWritingAssignment(list.assignmentId, {
            charsTotal: summary.charsTotal,
            mistakes: totalMistakes,
          });
        }
        // Хичээлийн дэвтэр бүтэн бичигдлээ → өнөөдрийн төлөвлөгөөний «ханз» алхам.
        if (list.kind === "lesson") markTodayHanzi("done");
      }
    }

    if (ti < tasks.length - 1) {
      tiRef.current = ti + 1;
      setTi(ti + 1);
      setPadKey((k) => k + 1);
    } else {
      flushSave();
      setScreen("end");
    }
  }

  function handlePadDone(result: WritingPadResult) {
    if (!step || !ch || !list) return;
    if (step.phase === "watch") return;
    let requeued = false;
    if (step.phase === "trace") {
      // Буцааж асуухын өмнөх дагаж бичилт нь нэмэлт — дэвтрийн нүдийг тоолохгүй.
      if (!step.extra) bumpProgress(ch, (prev) => ({ ...prev, traceDone: prev.traceDone + 1 }));
    } else {
      const sess = sessionRef.current.get(ch) ?? { mistakes: 0, usedHint: false };
      sessionRef.current.set(ch, {
        mistakes: sess.mistakes + result.mistakes,
        usedHint: sess.usedHint || result.usedHint,
      });
      // Холимог давталт нь нэмэлт — дэвтрийн нүдийг тоолохгүй, зөвхөн алдааг тэмдэглэнэ.
      bumpProgress(ch, (prev) => ({
        ...prev,
        memoryDone: step.extra ? prev.memoryDone : prev.memoryDone + 1,
        mistakes: prev.mistakes + result.mistakes,
      }));
      // Чадаагүй ханзыг орхихгүй: загварыг нь дахин дагаж бичүүлээд, хэдэн ханзны дараа дахин асууна.
      const failed = recallFailed(result);
      lastRecallOkRef.current.set(ch, !failed);
      const tries = retryCountRef.current.get(ch) ?? 0;
      if (failed && tries < MAX_RETRY) {
        retryCountRef.current.set(ch, tries + 1);
        const cur = tasksRef.current;
        const at = tiRef.current;
        const next = [...cur];
        next.splice(at + 1, 0, { ch, phase: "trace", index: 0, total: 1, base: 0, extra: "retry" });
        // Дахин асуух байрлал: хэдэн даалгаврын дараа, гэхдээ өөр ханзны хар → дагаж → санаж
        // гинжийг дундуур нь таслахгүй (зөвхөн санаж бичилтийн ард, дагаж бичилтийн өмнө биш).
        let again = Math.min(at + 2 + RETRY_GAP, next.length);
        while (
          again < next.length &&
          !(next[again - 1]!.phase === "memory" && next[again]!.phase !== "trace")
        ) {
          again += 1;
        }
        next.splice(again, 0, { ch, phase: "memory", index: 0, total: 1, base: 0, extra: "retry" });
        tasksRef.current = next;
        setTasks(next);
        requeued = true;
      }
    }
    setFeedback(
      requeued
        ? `🔁 ${tr(locale, "Дахиад нэг харъя")}`
        : result.mistakes === 0
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

  /** Нэг дор хэдэн ханз явахыг солино — бичиж дуусаагүй ханзуудаар шинээр дараална. */
  function changeGroup(next: number) {
    if (!list || next === group) return;
    try {
      window.localStorage.setItem(GROUP_KEY, String(next));
    } catch {
      // ignore
    }
    const finished = new Set(results.map((r) => r.ch));
    const left = queue.filter((c) => !finished.has(c));
    const keep = results;
    startSession(list, [...left, ...remaining], false, kids, next);
    setResults(keep);
  }

  function restart() {
    if (!list) return;
    startSession(list, [...results.map((r) => r.ch), ...remaining], true, kids);
  }

  /** Шалгалтад чадаагүй ханзуудаа л дахин бичнэ; үлдсэн ханз дараа нь үргэлжилнэ. */
  function redoWeak() {
    if (!list) return;
    const weak = results.filter((r) => r.weak).map((r) => r.ch);
    startSession(list, [...weak, ...remaining], true, kids);
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
    const weakCount = results.filter((r) => r.weak).length;
    const hasNext = remaining.length > 0;
    const nextSize = Math.min(kids ? KIDS_CHUNK : CHUNK, remaining.length);
    return shell(
      <div className="pb-8">
        <MobileCard padding="lg" className="mb-4 text-center">
          <p className={kids ? "text-5xl" : "text-3xl"}>{totalMistakes === 0 ? "🏆" : "🎉"}</p>
          <p className="mt-2 text-lg font-bold text-[var(--app-text)]">
            {results.length} {tr(locale, "ханз бичлээ")}
          </p>
          <p className="text-sm text-[var(--app-muted)]">
            {weakCount > 0
              ? `${weakCount} ${tr(locale, "ханз хараахан тогтоогүй — доор тэмдэглэв")}`
              : totalMistakes === 0
                ? tr(locale, "Алдаагүй! Маш сайн.")
                : `${totalMistakes} ${tr(locale, "алдаа")} · ${tr(locale, "алдсан ханз давталтад буцаж ирнэ")}`}
          </p>
          {hasNext ? (
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              {tr(locale, "Үлдсэн")}: {remaining.length} {tr(locale, "ханз")}
            </p>
          ) : null}
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
                    {r.weak ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        {tr(locale, "дахин")}
                      </span>
                    ) : r.done ? (
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
          {weakCount > 0 ? (
            <button type="button" onClick={redoWeak} className="app-btn-primary w-full">
              🔁 {tr(locale, "Тогтоогүй ханзаа дахин бичих")} ({weakCount})
            </button>
          ) : null}
          {hasNext ? (
            <button
              type="button"
              onClick={nextChunk}
              className={
                weakCount > 0
                  ? "w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                  : "app-btn-primary w-full"
              }
            >
              ▶ {tr(locale, "Дараагийн ханзууд")} ({nextSize})
            </button>
          ) : null}
          {lessonHref && !hasNext && weakCount === 0 ? (
            <Link href={lessonHref} className="app-btn-primary w-full text-center">
              {tr(locale, "Хичээл рүү буцах")} →
            </Link>
          ) : list.kind === "lesson" && !hasNext && weakCount === 0 ? (
            <Link href="/home" className="app-btn-primary w-full text-center">
              {tr(locale, "Нүүр рүү — өнөөдрийн төлөвлөгөө")} →
            </Link>
          ) : null}
          {lessonHref && (hasNext || weakCount > 0) ? (
            <Link
              href={lessonHref}
              className="w-full rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              ← {tr(locale, "Хичээл рүү буцах")}
            </Link>
          ) : null}
          <Link
            href={`/writing/${listId}`}
            className="w-full rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
          >
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
          href={lessonHref ?? `/writing/${listId}`}
          className="inline-flex items-center text-sm font-medium text-[var(--app-muted)] transition-colors hover:text-emerald-600"
        >
          {lessonHref ? tr(locale, "← Хичээл рүү") : tr(locale, "← Дэвтэр рүү")}
        </Link>
        <p className="text-xs font-bold text-[var(--app-muted)]">
          {Math.min(results.length + 1, queue.length)}/{queue.length} {tr(locale, "ханз")}
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
        {step.extra ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
            {step.extra === "check"
              ? `🔀 ${tr(locale, "Шалгалт — загваргүй санаж бич")}`
              : step.phase === "trace"
                ? `🔁 ${tr(locale, "Чадаагүй ханз — дахин дагаж бич")}`
                : `🔁 ${tr(locale, "Одоо дахин санаж бич")}`}
          </span>
        ) : (
          (["watch", "trace", "memory"] as WritingPadPhase[]).map((phase, i) => {
            // Үе шат бүрийг нэг чипээр: идэвхтэй бол одоогийн тоотой, үгүй бол эхнийх.
            const first = steps.find((x) => x.phase === phase);
            if (!first) return null;
            const active = phase === step.phase;
            const passed = !active && tasks.indexOf(first) < ti;
            const shown = active ? step : first;
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
          })
        )}
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

      {!kids && queue.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--app-muted)]">
          <span>{tr(locale, "Нэг дор хэдэн ханз:")}</span>
          {GROUP_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === group}
              onClick={() => changeGroup(n)}
              className={`h-7 w-7 rounded-full text-xs font-bold ${
                n === group
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      ) : null}

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
