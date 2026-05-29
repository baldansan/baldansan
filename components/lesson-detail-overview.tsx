"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getLearnedWordsSmart,
  getLessonStatusSmart,
  getQuizResultSmart,
  type LessonStatus,
} from "@/lib/progress";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { coursePath } from "@/lib/content";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

function statusLabel(status: LessonStatus): string {
  if (status === "completed") return "Completed";
  if (status === "started") return "In progress";
  return "Not started";
}

export function LessonDetailOverview({
  lesson,
  adminPreview = false,
}: Props) {
  const [status, setStatus] = useState<LessonStatus>("not_started");
  const [learnedCount, setLearnedCount] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setStatus(await getLessonStatusSmart(lesson.id));
      const learned = await getLearnedWordsSmart(lesson.id, lesson.vocabulary);
      setLearnedCount(learned.length);
      const quiz = await getQuizResultSmart(lesson.id);
      setBestScore(quiz?.bestPercentage ?? null);
    }
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [lesson.id, lesson.vocabulary]);

  const watchHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "watch",
  });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  return (
    <>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Lesson path</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { href: watchHref, title: "Watch", desc: "Video + subtitle" },
            { href: vocabHref, title: "Vocabulary", desc: `${lesson.vocabularyCount} words` },
            { href: quizHref, title: "Quiz", desc: `${lesson.quizCount} questions` },
          ].map((step) => (
            <Link
              key={step.title}
              href={step.href}
              className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-colors hover:bg-emerald-50"
            >
              <p className="font-semibold text-emerald-900">{step.title}</p>
              <p className="mt-1 text-xs text-slate-600">{step.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your progress</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
            {statusLabel(status)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
            {learnedCount} words learned
          </span>
          {bestScore != null ? (
            <span className="rounded-full bg-white px-3 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
              Best quiz: {bestScore}%
            </span>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={watchHref}
          className="inline-flex justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Watch lesson
        </Link>
        <Link
          href={vocabHref}
          className="inline-flex justify-center rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Study vocabulary
        </Link>
        <Link
          href={quizHref}
          className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-200"
        >
          Take quiz
        </Link>
        <Link
          href={coursePath(lesson.courseId)}
          className="inline-flex justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:border-emerald-200"
        >
          Back to course
        </Link>
      </section>
    </>
  );
}
