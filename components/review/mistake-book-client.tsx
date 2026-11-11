"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { recordQuestionAttempt } from "@/lib/analytics/record-question-attempt";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { shuffleArray } from "@/lib/games/game-data-core";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import {
  fetchMistakes,
  isDue,
  isMockMistake,
  practicableMistakes,
  type MistakeEntry,
} from "@/lib/supabase/mistake-book";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { prettyCourseTitle } from "@/lib/classroom/course-label";

type MistakeContext = {
  question: string | null;
  passage: string | null;
  explanation: string | null;
};
type LessonInfo = { title: string; courseId: string; orderIndex: number | null };

/** «hsk5-l19» гэсэн кодын оронд «HSK 5 · 19-р хичээл — Гарчиг». */
function lessonLabel(lessonId: string, info?: LessonInfo): string {
  if (lessonId === "hsk30-durem") return "HSK 3.0 дүрэм";
  if (lessonId === "helzui-suuri") return "Хэл зүйн суурь";
  const no = /l(\d+)$/.exec(lessonId)?.[1];
  if (!info) {
    const course = lessonId.replace(/-?l\d+$/, "");
    return `${prettyCourseTitle(course)}${no ? ` · ${Number(no)}-р хичээл` : ""}`;
  }
  // Гарчиг өөрөө «HSK4A 1-р хичээл — …» гэж эхэлдэг бол давхардуулахгүй.
  const title = info.title.replace(/^.*?хичээл\s*[—–-]\s*/u, "");
  return `${prettyCourseTitle(info.courseId)}${no ? ` · ${Number(no)}-р хичээл` : ""} — ${title}`;
}

const PRACTICE_DECK_SIZE = 10;

type View = "list" | "practice" | "result";

type PracticeQuestion = {
  mistake: MistakeEntry;
  options: string[];
};

const STAGE_LABELS: Record<string, string> = {
  quiz: "Сорил",
  word_practice: "Үгийн дасгал",
  mock_exam: "Мок шалгалт",
  grammar: "Дүрэм",
  grammar_exercise: "Дүрмийн дасгал",
  order: "Дараалал",
  mistake_review: "Алдааны давталт",
};


function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/** hsk_words-оос нэмэлт distractor утгууд (хүрэлцэхгүй үед). */
async function fetchExtraDistractors(): Promise<string[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  try {
    const { data } = await supabase
      .from("hsk_words")
      .select("meaning_mn")
      .not("meaning_mn", "is", null)
      .limit(60);
    return ((data ?? []) as { meaning_mn: string | null }[])
      .map((r) => r.meaning_mn?.trim() ?? "")
      .filter((v) => v.length > 0);
  } catch {
    return [];
  }
}

function buildPracticeDeck(
  pool: MistakeEntry[],
  allMistakes: MistakeEntry[],
  extraDistractors: string[]
): PracticeQuestion[] {
  const globalAnswers = [
    ...new Set(
      allMistakes
        .map((m) => m.correctAnswer?.trim() ?? "")
        .filter((v) => v.length > 0)
    ),
  ];

  return shuffleArray(pool)
    .slice(0, PRACTICE_DECK_SIZE)
    .map((mistake) => {
      const correct = mistake.correctAnswer!.trim();
      const options = [correct];

      // Хэрэглэгчийн өмнөх буруу хариулт — хамгийн сайн distractor.
      const oldWrong = mistake.selectedAnswer?.trim();
      if (oldWrong && oldWrong !== correct) {
        options.push(oldWrong);
      }

      const candidates = shuffleArray([
        ...globalAnswers.filter((v) => v !== correct && !options.includes(v)),
        ...extraDistractors.filter(
          (v) => v !== correct && !options.includes(v)
        ),
      ]);
      for (const cand of candidates) {
        if (options.length >= 4) break;
        if (!options.includes(cand)) options.push(cand);
      }

      return { mistake, options: shuffleArray(options) };
    });
}

export function MistakeBookClient() {
  useActivityTracker("review", "mistakes");
  const locale = useUiLocale();

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  // Жинхэнэ шалгалтын (mock:) алдаа тусдаа дэвтэрт — энд зөвхөн тоог харуулна.
  const [zhenti, setZhenti] = useState<{ total: number; due: number }>({ total: 0, due: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<View>("list");
  const [lessonFilter, setLessonFilter] = useState("all");
  // Асуултын бичвэр, эх, тайлбар (серверээс дугаараар нь олж авна).
  const [contexts, setContexts] = useState<Record<string, MistakeContext>>({});
  const [lessonInfo, setLessonInfo] = useState<Record<string, LessonInfo>>({});
  const [openLessons, setOpenLessons] = useState<string[]>([]);
  const [openTips, setOpenTips] = useState<string[]>([]);
  const typeFilter = "all";

  const [deck, setDeck] = useState<PracticeQuestion[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [remainingAfter, setRemainingAfter] = useState<number | null>(null);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    const { mistakes: rows, error: err } = await fetchMistakes(uid);
    if (err) setError(err);
    const mock = rows.filter(isMockMistake);
    setZhenti({ total: mock.length, due: mock.filter((m) => isDue(m)).length });
    const own = rows.filter((m) => !isMockMistake(m));
    setMistakes(own);
    setLoading(false);
    // Асуултуудыг ард нь татна — жагсаалт эхлээд гарч, асуулт нь дараа нь нэмэгдэнэ.
    if (own.length > 0) {
      try {
        const res = await fetch("/api/review/mistake-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: own.map((m) => ({ lessonId: m.lessonId, questionId: m.questionId })),
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            contexts?: Record<string, MistakeContext>;
            lessons?: Record<string, LessonInfo>;
          };
          setContexts(json.contexts ?? {});
          setLessonInfo(json.lessons ?? {});
        }
      } catch {
        /* асуултгүй ч жагсаалт ажиллана */
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!hasSupabaseConfig) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }
      const { userId: uid } = await getAuthenticatedUserId().catch(() => ({
        userId: null,
      }));
      setUserId(uid);
      setAuthChecked(true);
      if (uid) {
        void load(uid);
      } else {
        setLoading(false);
      }
    }
    void init();
  }, [load]);

  const filtered = useMemo(
    () =>
      mistakes.filter(
        (m) =>
          (lessonFilter === "all" || m.lessonId === lessonFilter) &&
          (typeFilter === "all" || m.questionType === typeFilter)
      ),
    [mistakes, lessonFilter, typeFilter]
  );

  // Хичээлээр бүлэглэнэ: олон алдаатай хичээл дээрээ.
  const groups = useMemo(() => {
    const map = new Map<string, MistakeEntry[]>();
    for (const m of mistakes) {
      const list = map.get(m.lessonId);
      if (list) list.push(m);
      else map.set(m.lessonId, [m]);
    }
    return [...map.entries()]
      .map(([lessonId, items]) => ({ lessonId, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [mistakes]);

  async function startPractice(onlyLesson?: string) {
    const pool = practicableMistakes(
      onlyLesson ? mistakes.filter((m) => m.lessonId === onlyLesson) : mistakes
    );
    if (pool.length === 0) return;
    let extra: string[] = [];
    const globalCount = new Set(
      practicableMistakes(mistakes).map((m) => m.correctAnswer!.trim())
    ).size;
    if (globalCount < 8) {
      extra = await fetchExtraDistractors();
    }
    setDeck(buildPracticeDeck(pool, mistakes, extra));
    setDeckIndex(0);
    setPicked(null);
    setLocked(false);
    setCorrectCount(0);
    setRemainingAfter(null);
    setView("practice");
  }

  function pickOption(option: string) {
    const q = deck[deckIndex];
    if (!q || locked) return;
    setLocked(true);
    setPicked(option);
    const isCorrect = option === q.mistake.correctAnswer?.trim();
    if (isCorrect) setCorrectCount((c) => c + 1);

    // Хариулт бүр question_attempts-д шинээр бичигдэнэ — «2 дараалан зөв
    // бол дэвтрээс хасагдана» дүрэм өөрөө ажиллана.
    recordQuestionAttempt({
      lessonId: q.mistake.lessonId,
      stage: "mistake_review",
      questionId: q.mistake.questionId,
      questionType: "choice",
      isCorrect,
      selectedAnswer: option,
      correctAnswer: q.mistake.correctAnswer,
    });
  }

  async function nextQuestion() {
    if (deckIndex >= deck.length - 1) {
      setView("result");
      if (userId) {
        // Дэвтэрт хэдэн алдаа үлдсэнийг шинээр тооцно.
        const { mistakes: fresh } = await fetchMistakes(userId);
        const words = fresh.filter((m) => !isMockMistake(m));
        setMistakes(words);
        setRemainingAfter(words.length);
      }
      return;
    }
    setDeckIndex((i) => i + 1);
    setPicked(null);
    setLocked(false);
  }

  // --- Зочин ---
  if (authChecked && !userId) {
    return (
      <div className="bs-mem-wizard">
        <h2 className="bs-mem-step-title">
          ❌ {tr(locale, "Миний алдаанууд")}
        </h2>
        <div className="mt-4 rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-4xl" aria-hidden>
            📔
          </p>
          <p className="mt-3 text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Нэвтэрч орвол алдаанууд чинь хадгалагдана")}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Алдсан асуулт бүр дэвтэрт орж, зөвхөн алдаагаа давтах боломжтой болно."
            )}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-[var(--app-primary)] px-6 py-2.5 text-sm font-bold text-white"
          >
            {tr(locale, "Нэвтрэх")} →
          </Link>
        </div>
      </div>
    );
  }

  if (!authChecked || loading) {
    return (
      <p className="py-12 text-center text-sm text-[var(--app-muted)]">
        {tr(locale, "Ачааллаж байна…")}
      </p>
    );
  }

  // --- Давтах горим ---
  if (view === "practice" && deck.length > 0) {
    const q = deck[deckIndex]!;
    const correct = q.mistake.correctAnswer?.trim();
    return (
      <div className="bs-mem-wizard">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="bs-mem-step-title">
            🔁 {tr(locale, "Алдааны давталт")}
          </h2>
          <span className="rounded-full bg-[var(--bs-green-50)] px-2.5 py-1 text-[11px] font-extrabold text-[var(--bs-green-700)]">
            {deckIndex + 1}/{deck.length}
          </span>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e1ebe5]">
          <div
            className="h-full rounded-full bg-[var(--bs-green)] transition-all"
            style={{ width: `${((deckIndex + 1) / deck.length) * 100}%` }}
          />
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-[11px] font-bold text-[var(--app-muted)]">
            {lessonLabel(q.mistake.lessonId, lessonInfo[q.mistake.lessonId])} ·{" "}
            {tr(locale, stageLabel(q.mistake.stage))}
          </p>
          {(() => {
            const ctx = contexts[`${q.mistake.lessonId}::${q.mistake.questionId}`];
            return ctx?.question || ctx?.passage ? (
              <div className="mt-3">
                {ctx.passage ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700" translate="no">
                    {ctx.passage}
                  </p>
                ) : null}
                {ctx.question ? (
                  <p className="mt-2 text-base font-bold leading-7 text-[var(--app-text)]" translate="no">
                    {ctx.question}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-center text-sm font-bold text-[var(--app-text)]">
                {tr(locale, "Аль нь зөв хариулт байсан бэ?")}
              </p>
            );
          })()}

          <div className="mt-4 grid gap-2">
            {q.options.map((option) => {
              let cls =
                "min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800";
              if (locked && option === correct) {
                cls =
                  "min-h-[48px] w-full rounded-xl bg-emerald-100 px-4 py-3 text-left text-sm font-medium text-emerald-800 ring-2 ring-emerald-400";
              } else if (locked && picked === option && option !== correct) {
                cls =
                  "min-h-[48px] w-full rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 ring-2 ring-red-300";
              }
              return (
                <button
                  key={option}
                  type="button"
                  disabled={locked}
                  onClick={() => pickOption(option)}
                  className={cls}
                  translate="no"
                >
                  {option}
                </button>
              );
            })}
          </div>

          {locked &&
          q.mistake.selectedAnswer &&
          q.mistake.selectedAnswer.trim() !== correct ? (
            <p className="mt-3 text-center text-xs text-[var(--app-muted)]">
              {tr(locale, "Өмнө нь буруу:")} <span translate="no">{q.mistake.selectedAnswer}</span>
            </p>
          ) : null}

          {locked ? (
            <button
              type="button"
              className="bs-mock-primary-btn mt-4"
              onClick={() => void nextQuestion()}
            >
              {deckIndex >= deck.length - 1
                ? tr(locale, "Дуусгах")
                : `${tr(locale, "Дараагийнх")} →`}
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="bs-mem-back mt-4"
          onClick={() => setView("list")}
        >
          ← {tr(locale, "Жагсаалт руу")}
        </button>
      </div>
    );
  }

  // --- Дүн ---
  if (view === "result") {
    return (
      <div className="bs-mem-wizard">
        <div className="rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-5xl" aria-hidden>
            {correctCount === deck.length ? "🏆" : "💪"}
          </p>
          <h2 className="mt-3 text-xl font-bold text-[var(--app-text)]">
            {correctCount}/{deck.length} {tr(locale, "зөв")}
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {remainingAfter == null
              ? tr(locale, "Ачааллаж байна…")
              : `${tr(locale, "Дэвтэрт")} ${remainingAfter} ${tr(locale, "алдаа үлдлээ")}`}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {remainingAfter != null && remainingAfter > 0 ? (
              <button
                type="button"
                className="bs-mock-primary-btn"
                onClick={() => void startPractice()}
              >
                🔁 {tr(locale, "Дахин давтах")}
              </button>
            ) : null}
            <button
              type="button"
              className="bs-mem-back"
              onClick={() => setView("list")}
            >
              ← {tr(locale, "Жагсаалт руу")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Жагсаалт ---
  const practicable = practicableMistakes(filtered);

  return (
    <div className="bs-mem-wizard">
      <h2 className="bs-mem-step-title">
        ❌ {tr(locale, "Миний алдаанууд")}
        {mistakes.length > 0 ? ` · ${mistakes.length}` : ""}
      </h2>

      <Link href="/review/mistakes/zhenti" className="bs-tm-card mt-3">
        <span className="bs-tm-card-ic bs-tm-card-ic--red" aria-hidden>
          📕
        </span>
        <span className="bs-tm-card-body">
          <span className="bs-tm-card-title">
            {tr(locale, "Жинхэнэ шалгалтын алдаа")}
            {zhenti.total > 0 ? ` · ${zhenti.total}` : ""}
          </span>
          <span className="bs-tm-card-sub">
            {zhenti.due > 0
              ? `${tr(locale, "Өнөөдөр давтах")}: ${zhenti.due} · 1·3·7 ${tr(locale, "хоног")}`
              : tr(locale, "Шалгалт, сонсголоос алдсан асуултууд — 1·3·7 хоногийн давталт")}
          </span>
        </span>
        <span className="bs-tm-card-chev" aria-hidden>›</span>
      </Link>


      {error ? <p className="mt-2 text-sm text-red-600">{tr(locale, error)}</p> : null}

      {mistakes.length === 0 && !error ? (
        <div className="mt-4 rounded-[20px] bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <p className="mt-3 text-sm font-bold text-emerald-700">
            {tr(locale, "Алдаа алга — маш сайн! ✅")}
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Хичээл, дасгал дээр алдсан асуултууд энд автоматаар цугларна."
            )}
          </p>
        </div>
      ) : null}

      {mistakes.length > 0 ? (
        <>
          <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">
            {tr(
              locale,
              "Хичээл, дасгал дээр буруу хариулсан асуултууд. Хоёр удаа зөв хариулбал жагсаалтаас гарна."
            )}
          </p>

          {practicable.length > 0 ? (
            <button
              type="button"
              onClick={() => void startPractice()}
              className="mt-3 w-full rounded-full bg-[var(--bs-green)] py-3.5 text-sm font-extrabold text-white shadow-sm active:scale-[0.99]"
            >
              🔁 {tr(locale, "Алдаагаа давтах")}{" "}
              {lessonFilter === "all" ? "" : `(${practicable.length})`}
            </button>
          ) : null}

          {/* Хичээлээр бүлэглэсэн — олон алдаатай нь дээрээ */}
          <ul className="mt-4 flex flex-col gap-2">
            {groups.map((g) => {
              const open = openLessons.includes(g.lessonId) || groups.length === 1;
              return (
                <li key={g.lessonId} className="rounded-[18px] bg-white shadow-sm ring-1 ring-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenLessons((prev) =>
                        prev.includes(g.lessonId)
                          ? prev.filter((x) => x !== g.lessonId)
                          : [...prev, g.lessonId]
                      )
                    }
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-extrabold ${
                        g.items.length >= 10
                          ? "bg-red-500 text-white"
                          : g.items.length >= 4
                            ? "bg-amber-400 text-slate-900"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {g.items.length}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold leading-5 text-[var(--app-text)]">
                      {lessonLabel(g.lessonId, lessonInfo[g.lessonId])}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{open ? "▴" : "▾"}</span>
                  </button>

                  {open ? (
                    <div className="border-t border-slate-100 px-3 pb-3">
                      <div className="flex flex-wrap gap-2 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLessonFilter(g.lessonId);
                            void startPractice(g.lessonId);
                          }}
                          className="rounded-full bg-[var(--bs-green-50)] px-3 py-1.5 text-xs font-bold text-[var(--bs-green-700)]"
                        >
                          🔁 {tr(locale, "Энэ хичээлийн алдааг давтах")}
                        </button>
                        {/^(hsk\d|yct|fazhan)/.test(g.lessonId) && /l\d+$/.test(g.lessonId) ? (
                          <Link
                            href={`/lessons/${g.lessonId}`}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                          >
                            📖 {tr(locale, "Хичээлийг нээх")}
                          </Link>
                        ) : null}
                      </div>
                      <ul className="flex flex-col gap-2">
                        {g.items.map((m) => {
                          const ctx = contexts[`${m.lessonId}::${m.questionId}`];
                          const tipOpen = openTips.includes(m.key);
                          return (
                            <li key={m.key} className="rounded-2xl bg-slate-50 p-3">
                              {ctx?.passage ? (
                                <p className="mb-1.5 text-xs leading-5 text-slate-500" translate="no">
                                  {ctx.passage}
                                </p>
                              ) : null}
                              <p className="text-sm font-bold leading-6 text-[var(--app-text)]" translate="no">
                                {ctx?.question ?? (
                                  <span className="font-medium text-slate-400">
                                    {tr(locale, stageLabel(m.stage))} — {tr(locale, "асуултын бичвэр олдсонгүй")}
                                  </span>
                                )}
                              </p>
                              {m.selectedAnswer && m.selectedAnswer !== m.correctAnswer ? (
                                <p className="mt-2 flex gap-2 text-sm text-red-600" translate="no">
                                  <span className="shrink-0 font-bold">✗ {tr(locale, "Таны")}:</span>
                                  <span className="break-words">{m.selectedAnswer}</span>
                                </p>
                              ) : null}
                              {m.correctAnswer ? (
                                <p className="mt-1 flex gap-2 text-sm text-emerald-700" translate="no">
                                  <span className="shrink-0 font-bold">✓ {tr(locale, "Зөв")}:</span>
                                  <span className="break-words font-bold">{m.correctAnswer}</span>
                                </p>
                              ) : null}
                              {ctx?.explanation ? (
                                tipOpen ? (
                                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-6 text-amber-950" translate="no">
                                    💡 {ctx.explanation}
                                  </p>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setOpenTips((p) => [...p, m.key])}
                                    className="mt-2 text-xs font-bold text-amber-700"
                                  >
                                    💡 {tr(locale, "Яагаад? Тайлбар харах")}
                                  </button>
                                )
                              ) : null}
                              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                <span>{tr(locale, stageLabel(m.stage))}</span>
                                <span>· {formatDate(m.lastWrongAt)}</span>
                                {m.wrongCount > 1 ? (
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                                    {m.wrongCount} {tr(locale, "удаа алдсан")}
                                  </span>
                                ) : null}
                                {m.lastAttemptCorrect ? (
                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                    {tr(locale, "1 зөв — дахиад 1!")}
                                  </span>
                                ) : null}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
