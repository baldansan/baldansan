"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { LocalProgressNote } from "@/components/local-progress-note";
import { lessonPath, lessonVocabularyPath } from "@/lib/content";
import {
  getAllLearnedWords,
  getAllQuizResults,
  getLastActiveLessonId,
  getTotalLearnedWords,
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
};

function formatQuizDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
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

export function ReviewDashboard({ lessons }: Props) {
  const [ready, setReady] = useState(false);
  const [learnedEntries, setLearnedEntries] = useState<LearnedWordEntry[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultEntry[]>([]);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string | null>(
    null
  );

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

  useEffect(() => {
    function refresh() {
      setLearnedEntries(getAllLearnedWords());
      setQuizResults(getAllQuizResults());
      setLastActiveLessonId(getLastActiveLessonId());
      setReady(true);
    }

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const totalLearned = getTotalLearnedWords();

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
        <AppHeader active="review" />
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-16 pb-24 sm:px-6 md:pb-10">
          <p className="text-center text-sm text-slate-500">Ачааллаж байна...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader active="review" />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-2 sm:gap-8 sm:px-6 md:pb-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Давтах үгс
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Энэ төхөөрөмж дээр хадгалагдсан сурсан үгс болон quiz ахиц.
          </p>
          <div className="mt-3">
            <LocalProgressNote />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-emerald-200">
            <p className="text-2xl font-bold text-emerald-700">{totalLearned}</p>
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
            Continue learning
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
              Quiz review summary
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

          {learnedEntries.length === 0 ? (
            <EmptyState
              title="Одоогоор давтах үг алга."
              description="Vocabulary хэсэгт үгээ Mark as learned дарж энд харагдуулна."
              action={
                <Link
                  href={lessonVocabularyPath("1")}
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Go to vocabulary
                </Link>
              }
            />
          ) : (
            groupedByLesson.map(({ lessonId, lesson, entries }) => (
              <article
                key={lessonId}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Lesson {lessonId}
                    {lesson
                      ? ` — ${lesson.title} ${lesson.chineseTitle}`
                      : ""}
                  </h3>
                  <Link
                    href={lessonVocabularyPath(lessonId)}
                    className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
                  >
                    Vocabulary →
                  </Link>
                </div>

                <ul className="mt-4 flex flex-col gap-3">
                  {entries.map((entry) => {
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
              </article>
            ))
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
