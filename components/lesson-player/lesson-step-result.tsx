"use client";

import Link from "next/link";
import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { lessonTrainingPath } from "@/lib/content";
import { PASSING_QUIZ_PERCENT } from "@/lib/progress";

type Props = {
  lessonId: string;
  nextLessonId: string | null;
  adminPreview?: boolean;
  quizCorrect: number;
  quizTotal: number;
  stepsCompleted: number;
  totalSteps: number;
  onRestart: () => void;
};

export function LessonStepResult({
  lessonId,
  nextLessonId,
  adminPreview = false,
  quizCorrect,
  quizTotal,
  stepsCompleted,
  totalSteps,
  onRestart,
}: Props) {
  const quizPercent =
    quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 100;
  const passed = quizTotal === 0 || quizPercent >= PASSING_QUIZ_PERCENT;
  const xp = passed ? Math.max(10, quizCorrect * 5) : quizCorrect * 2;

  const quizHref = lessonPreviewPath(lessonId, {
    adminPreview,
    subpath: "quiz",
  });
  const vocabHref = `${lessonPreviewPath(lessonId, {
    adminPreview,
    subpath: "vocabulary",
  })}?view=flashcard`;
  const studyHref = "/study";
  const nextHref = nextLessonId
    ? lessonPreviewPath(nextLessonId, { adminPreview })
    : null;
  const nextTrainingHref = nextLessonId
    ? lessonTrainingPath(nextLessonId, { preview: adminPreview })
    : null;

  return (
    <LessonPlayerCard>
      <div className="flex flex-col items-center text-center">
        <p className="text-5xl" aria-hidden>
          🏆
        </p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">
          Хичээл дууслаа!
        </h1>
        <p className="mt-2 max-w-full break-words text-sm text-slate-600">
          {stepsCompleted} / {totalSteps} алхам ·{" "}
          {quizTotal > 0
            ? `Quiz ${quizCorrect}/${quizTotal} (${quizPercent}%)`
            : "Quiz байхгүй"}
        </p>
        <p className="mt-2 text-lg font-bold text-emerald-600">+{xp} XP</p>
        {!passed && quizTotal > 0 ? (
          <p className="mt-2 text-sm text-amber-700">
            {PASSING_QUIZ_PERCENT}%-аас дээш оноо авахад хичээл бүрэн дуусна.
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex w-full flex-col gap-2.5">
        {quizTotal > 0 ? (
          <Link href={quizHref} className="app-btn-secondary w-full">
            Өөрийгөө шалгах
          </Link>
        ) : null}
        <Link href={studyHref} className="app-btn-secondary w-full">
          Судлах хэсэг рүү
        </Link>
        {nextTrainingHref ? (
          <Link href={nextTrainingHref} className="app-btn-primary w-full">
            Дараагийн хичээл
          </Link>
        ) : nextHref ? (
          <Link href={nextHref} className="app-btn-primary w-full">
            Дараагийн хичээл
          </Link>
        ) : null}
        <Link
          href={vocabHref}
          className="app-btn-outline-green w-full"
        >
          Картаар давтах
        </Link>
        <button type="button" onClick={onRestart} className="app-btn-outline-green w-full">
          Дахин үзэх
        </button>
      </div>
    </LessonPlayerCard>
  );
}

export function LessonStepNextLesson({
  title,
  subtitle,
  nextLessonId,
  adminPreview = false,
}: {
  title: string;
  subtitle?: string;
  nextLessonId: string | null;
  adminPreview?: boolean;
}) {
  const nextTrainingHref = nextLessonId
    ? lessonTrainingPath(nextLessonId, { preview: adminPreview })
    : null;
  const studyHref = "/study";

  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">Баяр хүргэе!</h1>
      <p className="mt-2 break-words text-sm text-slate-600">{title}</p>
      {subtitle ? (
        <p className="mt-1 text-base font-semibold text-emerald-700">{subtitle}</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2.5">
        {nextTrainingHref ? (
          <Link href={nextTrainingHref} className="app-btn-primary w-full">
            Дараагийн хичээл рүү
          </Link>
        ) : (
          <Link href={studyHref} className="app-btn-primary w-full">
            Судлах хэсэг рүү
          </Link>
        )}
      </div>
    </LessonPlayerCard>
  );
}
