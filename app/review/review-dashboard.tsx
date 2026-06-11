"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { SHELL_MAIN_REVIEW } from "@/lib/app-shell-classes";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { ReviewContinueCard } from "@/components/review-continue-card";
import { EmptyState } from "@/components/empty-state";
import { LocalProgressNote } from "@/components/local-progress-note";
import { lessonPath, lessonVocabularyPath } from "@/lib/content";
import { recordActivity } from "@/lib/retention/retention-service";
import { getCurrentUser, hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  getAllLearnedWordsSmart,
  getAllQuizResultsSmart,
  getLastActiveLessonId,
  vocabularyWordKey,
  type LearnedWordEntry,
  type QuizResultEntry,
} from "@/lib/progress";
import type { VocabularyWord } from "@/types/lesson";

export type LessonVocabSnapshot = {
  id: string;
  title: string;
  chineseTitle: string;
  vocabulary: VocabularyWord[];
};

type Props = {
  lessons: LessonVocabSnapshot[];
  lessonIds: string[];
};

import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";

function formatQuizDate(iso: string): string {
  return formatMongoliaDateTimeWithLabel(iso) || iso;
}

function resolveWord(
  vocabulary: VocabularyWord[],
  wordKey: string
): VocabularyWord | null {
  return (
    vocabulary.find(
      (word) =>
        vocabularyWordKey(word) === wordKey ||
        word.id === wordKey ||
        word.chinese === wordKey
    ) ?? null
  );
}

export function ReviewDashboard({ lessons, lessonIds }: Props) {
  const [ready, setReady] = useState(false);
  const [learnedEntries, setLearnedEntries] = useState<LearnedWordEntry[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultEntry[]>([]);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string | null>(
    null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hskFilter, setHskFilter] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const lessonById = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.id, lesson])),
    [lessons]
  );

  const groupedByLesson = useMemo(() => {
    const groups = new Map<string, LearnedWordEntry[]>();

    for (const entry of learnedEntries) {
      const list = groups.get(entry.lessonId) ?? [];
      list.push(entry);
      groups.set(entry.lessonId, list);
    }

    const orderedIds = [
      ...lessons.map((lesson) => lesson.id),
      ...[...groups.keys()].filter((id) => !lessonById.has(id)),
    ];

    return orderedIds
      .filter((id) => groups.has(id))
      .map((lessonId) => ({
        lessonId,
        lesson: lessonById.get(lessonId),
        entries: groups.get(lessonId) ?? [],
      }));
  }, [learnedEntries, lessons, lessonById]);

  const hskLevels = useMemo(() => {
    const levels = new Set<string>();
    for (const group of groupedByLesson) {
      for (const entry of group.entries) {
        const word = group.lesson
          ? resolveWord(group.lesson.vocabulary, entry.wordKey)
          : null;
        if (word?.hskLevel) levels.add(word.hskLevel);
      }
    }
    return ["all", ...Array.from(levels).sort()];
  }, [groupedByLesson]);

  function filteredEntries(
    lesson: LessonVocabSnapshot | undefined,
    entries: LearnedWordEntry[]
  ) {
    if (hskFilter === "all") return entries;
    return entries.filter((entry) => {
      const word = lesson ? resolveWord(lesson.vocabulary, entry.wordKey) : null;
      return word?.hskLevel === hskFilter;
    });
  }

  useEffect(() => {
    void recordActivity("review_opened");
  }, []);

  useEffect(() => {
    void recordActivity("review_opened");

    async function refresh() {
      if (hasSupabaseConfig) {
        const { data } = await getCurrentUser();
        setIsLoggedIn(Boolean(data));
      } else {
        setIsLoggedIn(false);
      }

      const entries = await getAllLearnedWordsSmart(
        lessons.map((lesson) => ({
          id: lesson.id,
          vocabulary: lesson.vocabulary,
        }))
      );
      setLearnedEntries(entries);
      setQuizResults(await getAllQuizResultsSmart());
      setLastActiveLessonId(getLastActiveLessonId());
      setReady(true);
    }

    const onFocus = () => {
      void refresh();
    };

    void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lessons]);

  if (!ready) {
    return (
      <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_REVIEW}>
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна...
        </p>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell activeTab="study" mainClassName={SHELL_MAIN_REVIEW}>
      <div className="flex flex-col gap-5">
        <section>
          <h1 className="text-xl font-bold tracking-tight text-[var(--app-text)]">
            Давтах үгс
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Энэ төхөөрөмж дээр хадгалагдсан сурсан үгс болон quiz ахиц.
          </p>
          <div className="mt-3">
            <LocalProgressNote />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Нэвтэрсэн үед сурсан үгс аккаунттай холбогдож хадгалагдана.
          </p>
          {isLoggedIn ? (
            <p className="mt-1 text-sm text-emerald-700">
              Та нэвтэрсэн — сурсан үгс Supabase-д хадгалагдана.
            </p>
          ) : null}
        </section>

        <ReviewContinueCard lessonIds={lessonIds} />

        <section className="app-game-mission p-5">
          <h2 className="font-bold text-white">Үг давтах тоглоомууд</h2>
          <p className="mt-2 text-sm text-purple-100">
            Сурсан үгээ тоглоомоор бататга.
          </p>
          <div className="mt-3 [&_a]:!bg-white/20 [&_a]:!text-white [&_a]:ring-1 [&_a]:ring-white/30">
            <GamePracticeLinks
              lessonId={lastActiveLessonId ?? lessonIds[0] ?? "1"}
              include={["match", "translate", "missing-word"]}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-emerald-50/70 p-5 ring-1 ring-emerald-200">
          <h2 className="font-semibold text-emerald-900">Daily review & reports</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Review хийж streak, achievement, weekly report-оо үргэлжлүүл.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/reminders" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Set reminder</Link>
            <Link href="/weekly-report" className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">Weekly report</Link>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-emerald-200">
            <p className="text-2xl font-bold text-emerald-700">
              {learnedEntries.length}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Learned vocabulary
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-2xl font-bold text-emerald-700">
              {quizResults.length}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Quiz results saved
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Үргэлжлүүлэх
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Сүүлд сурсан хичээлээ үргэлжлүүлээрэй.
          </p>
          <div className="mt-4">
            {lastActiveLessonId ? (
              <Link
                href={lessonPath(lastActiveLessonId)}
                className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Continue Lesson {lastActiveLessonId} →
              </Link>
            ) : (
              <Link
                href="/courses/hsk5"
                className="inline-flex rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Start HSK5 Course →
              </Link>
            )}
          </div>
        </section>

        {quizResults.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {isLoggedIn ? "Аккаунттай холбогдсон quiz" : "Quiz review summary"}
            </h2>
            {quizResults.map(({ lessonId, result }) => (
              <article
                key={lessonId}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    Lesson {lessonId}
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Best {result.bestPercentage}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Latest: {result.score} / {result.total} ({result.percentage}%)
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatQuizDate(result.updatedAt)}
                </p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Learned words by lesson
          </h2>

          {learnedEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hskLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setHskFilter(level)}
                  className={
                    hskFilter === level
                      ? "rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
                  }
                >
                  {level === "all" ? "All HSK" : level}
                </button>
              ))}
            </div>
          ) : null}

          {learnedEntries.length === 0 ? (
            <EmptyState
              title="Одоогоор review хийх үг алга."
              description="Vocabulary page дээрээс үг нэмээрэй."
              action={
                <Link
                  href="/courses/hsk5"
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Суралцаж эхлэх
                </Link>
              }
            />
          ) : (
            groupedByLesson.map(({ lessonId, lesson, entries }) => {
              const visible = filteredEntries(lesson, entries);
              if (visible.length === 0) return null;
              const isCollapsed = collapsed[lessonId] ?? false;
              return (
              <article
                key={lessonId}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [lessonId]: !isCollapsed,
                      }))
                    }
                    className="text-left"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">
                      Lesson {lessonId}
                      {lesson
                        ? ` — ${lesson.title} ${lesson.chineseTitle}`
                        : ""}{" "}
                      <span className="text-sm font-normal text-slate-500">
                        ({visible.length})
                      </span>
                    </h3>
                  </button>
                  <Link
                    href={lessonVocabularyPath(lessonId)}
                    className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
                  >
                    Vocabulary →
                  </Link>
                </div>

                {!isCollapsed ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {visible.map((entry) => {
                    const word = lesson
                      ? resolveWord(lesson.vocabulary, entry.wordKey)
                      : null;

                    return (
                      <li
                        key={`${entry.lessonId}-${entry.wordKey}`}
                        className="rounded-xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100"
                      >
                        {word ? (
                          <>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-xl font-bold text-slate-900">
                                {word.chinese}
                              </p>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                {word.hskLevel}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-emerald-700">
                              {word.pinyin}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {word.mongolian}
                            </p>
                          </>
                        ) : (
                          <p className="text-base font-semibold text-slate-800">
                            {entry.wordKey}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
                ) : null}
              </article>
              );
            })
          )}
        </section>
      </div>
    </MobileAppShell>
  );
}
