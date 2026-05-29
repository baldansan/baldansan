"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LocalProgressNote } from "@/components/local-progress-note";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { LessonMobileStepBar } from "@/components/lesson-mobile-step-bar";
import { coursePath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import {
  getQuizResultSmart,
  markLessonCompletedSmart,
  PASSING_QUIZ_PERCENT,
  saveQuizResultSmart,
  type QuizResult,
} from "@/lib/progress";
import { buildQuizDetailedAnswer, type QuizDetailedAnswer } from "@/lib/quiz-answers";
import type { LessonContent } from "@/types/lesson-content";

function getResultMessage(percent: number) {
  if (percent >= 90) return "Маш сайн! Дараагийн хичээл рүү орж болно.";
  if (percent >= 70) return "Сайн байна. Алдсан үгээ vocabulary хэсгээс давтаарай.";
  return "Дахиад нэг удаа үзээд quiz-ээ давтаарай.";
}

type Props = {
  lesson: LessonContent;
  nextLessonId: string | null;
  adminPreview?: boolean;
};

export function LessonQuizClient({
  lesson,
  nextLessonId,
  adminPreview = false,
}: Props) {
  const total = lesson.quizQuestions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerDetails, setAnswerDetails] = useState<QuizDetailedAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [savedResult, setSavedResult] = useState<QuizResult | null>(null);
  const persistAttemptRef = useRef(false);

  const current = lesson.quizQuestions[currentIndex];
  const isCorrect = selected === current?.correctAnswer;

  const questionProgressPercent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round(((currentIndex + 1) / total) * 100);
  }, [currentIndex, total]);

  const percent = useMemo(
    () => (total > 0 ? Math.round((correctCount / total) * 100) : 0),
    [correctCount, total]
  );

  useEffect(() => {
    async function load() {
      setSavedResult(await getQuizResultSmart(lesson.id));
    }
    void load();
  }, [lesson.id]);

  useEffect(() => {
    if (!finished || total === 0 || persistAttemptRef.current) {
      return;
    }
    persistAttemptRef.current = true;

    async function save() {
      const result = await saveQuizResultSmart(
        lesson.id,
        correctCount,
        total,
        percent,
        answerDetails
      );
      setSavedResult(result);

      if (percent >= PASSING_QUIZ_PERCENT) {
        await markLessonCompletedSmart(lesson.id);
      }
    }

    void save();
  }, [finished, lesson.id, correctCount, total, percent, answerDetails]);

  function handleSelect(option: string) {
    if (!current || revealed) return;
    setSelected(option);
    setRevealed(true);
    const orderIndex = current.orderIndex ?? currentIndex;
    setAnswerDetails((prev) => [
      ...prev,
      buildQuizDetailedAnswer(current, orderIndex, option),
    ]);
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
    setAnswerDetails([]);
    setFinished(false);
    persistAttemptRef.current = false;
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-32 pt-2 sm:gap-8 sm:px-6 md:pb-10">
        {adminPreview ? <AdminPreviewBanner /> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href={lessonPreviewPath(lesson.id, { adminPreview })}
            className="inline-flex w-fit text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
          >
            ← Lesson detail
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, {
              adminPreview,
              subpath: "watch",
            })}
            className="inline-flex w-fit text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-600"
          >
            Watch lesson
          </Link>
          <Link
            href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
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

        {total === 0 ? (
          <EmptyState
            title="No quiz questions available"
            description="Энэ хичээлд quiz асуулт одоогоор байхгүй байна. Vocabulary эсвэл watch хэсгээс үргэлжлүүлнэ үү."
            action={
              <>
                <Link
                  href={lessonPreviewPath(lesson.id, { adminPreview })}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Back to lesson
                </Link>
                <Link
                  href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  Үг давтах
                </Link>
              </>
            }
          />
        ) : finished ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-200 sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Үр дүн</h2>
            <p className="mt-4 text-4xl font-bold text-emerald-600">{percent}%</p>
            <p className="mt-2 text-sm text-slate-600">
              {correctCount} / {total} зөв
            </p>
            <p className="mt-4 text-base font-medium text-slate-800">
              {getResultMessage(percent)}
            </p>
            {savedResult ? (
              <p className="mt-3 text-sm text-slate-600">
                Best score: {savedResult.bestPercentage}%
                {percent < savedResult.bestPercentage
                  ? ` · This attempt: ${percent}%`
                  : null}
              </p>
            ) : null}
            {answerDetails.filter((a) => !a.isCorrect).length > 0 ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <h3 className="text-sm font-semibold text-amber-900">
                  Review wrong answers
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                  {answerDetails
                    .filter((a) => !a.isCorrect)
                    .map((a, i) => (
                      <li key={`${a.orderIndex}-${i}`}>
                        {a.question}: зөв хариулт — {a.correctAnswer}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-3">
              <LocalProgressNote />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={restartQuiz}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Restart quiz
              </button>
              <Link
                href={lessonPreviewPath(lesson.id, { adminPreview, subpath: "vocabulary" })}
                className="w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                Үг давтах
              </Link>
              <Link
                href={lessonPreviewPath(lesson.id, {
              adminPreview,
              subpath: "watch",
            })}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Watch lesson
              </Link>
              {nextLessonId ? (
                <Link
                  href={lessonPreviewPath(nextLessonId, { adminPreview })}
                  className="w-full rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Next lesson
                </Link>
              ) : null}
              <Link
                href={coursePath(lesson.courseId)}
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Курс руу буцах
              </Link>
            </div>
          </section>
        ) : (
          current && (
            <>
              <div>
                <p className="text-sm font-medium text-emerald-700">
                  Question {currentIndex + 1} / {total}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${questionProgressPercent}%` }}
                  />
                </div>
              </div>

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
        <LessonMobileStepBar
          lessonId={lesson.id}
          courseId={lesson.courseId}
          current="quiz"
          adminPreview={adminPreview}
        />
      </main>

      <BottomNav />
    </div>
  );
}
