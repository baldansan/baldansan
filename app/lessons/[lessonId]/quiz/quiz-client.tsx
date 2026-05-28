"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import {
  coursePath,
  lessonPath,
  lessonVocabularyPath,
  lessonWatchPath,
} from "@/lib/content";
import type { LessonContent } from "@/types/lesson-content";

function getResultMessage(percent: number) {
  if (percent >= 80) return "Маш сайн байна!";
  if (percent >= 50) return "Дахиад нэг давтаад үзье.";
  return "Vocabulary хэсгээ дахин үзвэл илүү сайн.";
}

type Props = {
  lesson: LessonContent;
  nextLessonId: string | null;
};

export function LessonQuizClient({ lesson, nextLessonId }: Props) {
  const total = lesson.quizQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = lesson.quizQuestions[currentIndex];
  const isCorrect = selected === current?.correctAnswer;

  const percent = useMemo(
    () => (total > 0 ? Math.round((correctCount / total) * 100) : 0),
    [correctCount, total]
  );

  function handleSelect(option: string) {
    if (!current || revealed) return;
    setSelected(option);
    setRevealed(true);
    if (option === current.correctAnswer) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      return;
    }
    setFinished(true);
  }

  function restartQuiz() {
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
  }

  function optionClass(option: string) {
    if (!revealed || !current) {
      return selected === option
        ? "w-full rounded-xl bg-emerald-500 px-4 py-3 text-left text-sm font-semibold text-white ring-2 ring-emerald-400"
        : "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-800 transition-colors hover:border-emerald-200 hover:bg-emerald-50";
    }
    if (option === current.correctAnswer) {
      return "w-full rounded-xl bg-emerald-100 px-4 py-3 text-left text-sm font-semibold text-emerald-800 ring-2 ring-emerald-400";
    }
    if (option === selected) {
      return "w-full rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700 ring-2 ring-red-300";
    }
    return "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-500";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-white text-slate-900">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-2 sm:gap-8 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href={lessonPath(lesson.id)}
            className="inline-flex w-fit text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            ← Lesson detail
          </Link>
          <Link
            href={lessonWatchPath(lesson.id)}
            className="inline-flex w-fit text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            Watch lesson
          </Link>
          <Link
            href={lessonVocabularyPath(lesson.id)}
            className="inline-flex w-fit text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            Vocabulary
          </Link>
        </div>

        <section>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Quiz — {lesson.title} {lesson.chineseTitle}
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Сурсан үг, өгүүлбэрээ шалгаарай.
          </p>
        </section>

        {finished ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Үр дүн</h2>
            <p className="mt-4 text-4xl font-bold text-emerald-600">{percent}%</p>
            <p className="mt-2 text-sm text-slate-600">
              {correctCount} / {total} зөв
            </p>
            <p className="mt-4 text-base font-medium text-slate-800">
              {getResultMessage(percent)}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={restartQuiz}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Restart quiz
              </button>
              <Link
                href={lessonVocabularyPath(lesson.id)}
                className="w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Review vocabulary
              </Link>
              <Link
                href={lessonWatchPath(lesson.id)}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Watch lesson
              </Link>
              {nextLessonId ? (
                <Link
                  href={lessonPath(nextLessonId)}
                  className="w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Next lesson
                </Link>
              ) : null}
              <Link
                href={coursePath(lesson.courseId)}
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back to course
              </Link>
            </div>
          </section>
        ) : (
          current && (
            <>
              <p className="text-sm font-medium text-emerald-700">
                Question {currentIndex + 1} / {total}
              </p>

              <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {current.type === "cloze" ? "Cloze blank" : "Multiple choice"}
                </p>
                <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
                  {current.question}
                </h2>

                <div className="mt-5 flex flex-col gap-2">
                  {current.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={revealed}
                      className={optionClass(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {revealed && (
                  <div
                    className={
                      isCorrect
                        ? "mt-4 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200"
                        : "mt-4 rounded-xl bg-red-50 p-4 ring-1 ring-red-200"
                    }
                  >
                    <p
                      className={
                        isCorrect
                          ? "text-sm font-semibold text-emerald-800"
                          : "text-sm font-semibold text-red-800"
                      }
                    >
                      {isCorrect ? "Зөв!" : "Буруу"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {current.explanation}
                    </p>
                  </div>
                )}

                {revealed && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="mt-5 w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    {currentIndex < total - 1 ? "Next" : "See results"}
                  </button>
                )}
              </section>
            </>
          )
        )}
      </main>
    </div>
  );
}
