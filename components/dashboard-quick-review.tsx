"use client";

import Link from "next/link";
import { lessonPath, lessonVocabularyPath } from "@/lib/content";
import type { QuizResultEntry } from "@/lib/progress";

type Props = {
  continueHref: string;
  latestQuiz: QuizResultEntry | null;
};

export function DashboardQuickReview({
  continueHref,
  latestQuiz,
}: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Quick review</h2>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/review"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Review learned words
        </Link>
        {latestQuiz ? (
          <Link
            href={lessonPath(latestQuiz.lessonId) + "/quiz"}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-200"
          >
            Retake Lesson {latestQuiz.lessonId} quiz
          </Link>
        ) : null}
        <Link
          href={continueHref}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Continue course
        </Link>
        <Link
          href={lessonVocabularyPath("1")}
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Vocabulary
        </Link>
      </div>
    </section>
  );
}
