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
  practicableMistakes,
  type MistakeEntry,
} from "@/lib/supabase/mistake-book";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

const PRACTICE_DECK_SIZE = 10;

type View = "list" | "practice" | "result";

type PracticeQuestion = {
  mistake: MistakeEntry;
  options: string[];
};

const STAGE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  word_practice: "Үгийн дасгал",
  mock_exam: "Мок шалгалт",
  grammar: "Дүрэм",
  grammar_exercise: "Дүрмийн дасгал",
  order: "Дараалал",
  mistake_review: "Алдааны давталт",
};

const TYPE_LABELS: Record<string, string> = {
  choice: "Сонголт",
  judge: "Зөв/буруу",
  fill: "Нөхөх",
  order: "Дараалал",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<View>("list");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
    setMistakes(rows);
    setLoading(false);
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

  const lessons = useMemo(
    () => [...new Set(mistakes.map((m) => m.lessonId))].sort(),
    [mistakes]
  );
  const types = useMemo(
    () => [...new Set(mistakes.map((m) => m.questionType))],
    [mistakes]
  );

  const filtered = useMemo(
    () =>
      mistakes.filter(
        (m) =>
          (lessonFilter === "all" || m.lessonId === lessonFilter) &&
          (typeFilter === "all" || m.questionType === typeFilter)
      ),
    [mistakes, lessonFilter, typeFilter]
  );

  async function startPractice() {
    const pool = practicableMistakes(filtered);
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
        setMistakes(fresh);
        setRemainingAfter(fresh.length);
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
            {q.mistake.lessonId} · {stageLabel(q.mistake.stage)} ·{" "}
            {formatDate(q.mistake.lastWrongAt)}
          </p>
          <p className="mt-2 text-center text-sm font-bold text-[var(--app-text)]">
            {tr(locale, "Аль нь зөв хариулт байсан бэ?")}
          </p>

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
              {tr(locale, "Өмнө нь буруу:")} {q.mistake.selectedAnswer}
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
          {practicable.length > 0 ? (
            <button
              type="button"
              className="bs-mock-primary-btn mt-3"
              onClick={() => void startPractice()}
            >
              🔁 {tr(locale, "Алдаагаа давтах")}
            </button>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={lessonFilter}
              onChange={(e) => setLessonFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              aria-label={tr(locale, "Хичээлээр шүүх")}
            >
              <option value="all">
                {tr(locale, "Бүх хичээл")} ({mistakes.length})
              </option>
              {lessons.map((lessonId) => (
                <option key={lessonId} value={lessonId}>
                  {lessonId}
                </option>
              ))}
            </select>
            {["all", ...types].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                  typeFilter === type
                    ? "bg-[var(--bs-green)] text-white ring-[var(--bs-green)]"
                    : "bg-white text-slate-600 ring-slate-200"
                }`}
              >
                {type === "all"
                  ? tr(locale, "Бүгд")
                  : tr(locale, TYPE_LABELS[type] ?? type)}
              </button>
            ))}
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {filtered.map((m) => (
              <li
                key={m.key}
                className="rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[var(--app-muted)]">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {m.lessonId}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">
                    {tr(locale, stageLabel(m.stage))}
                  </span>
                  <span>{formatDate(m.lastWrongAt)}</span>
                  {m.wrongCount > 1 ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                      ×{m.wrongCount}
                    </span>
                  ) : null}
                  {m.lastAttemptCorrect ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      {tr(locale, "1 зөв — дахиад 1!")}
                    </span>
                  ) : null}
                </div>
                {m.correctAnswer ? (
                  <p className="mt-2 break-words text-sm font-bold text-emerald-700">
                    ✓ {m.correctAnswer}
                  </p>
                ) : null}
                {m.selectedAnswer &&
                m.selectedAnswer !== m.correctAnswer ? (
                  <p className="mt-1 break-words text-xs text-red-500 line-through">
                    {m.selectedAnswer}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
