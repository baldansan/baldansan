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
import { LEARNER_LESSON } from "@/lib/learner-labels";
import {
  CtaButtonRow,
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

function statusLabel(status: LessonStatus): string {
  if (status === "completed") return "Дууссан";
  if (status === "started") return "Яваж байна";
  return "Эхлээгүй";
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
      <SectionCard>
        <h2 className="text-lg font-semibold text-slate-900">Хичээлийн алхам</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", href: watchHref, title: LEARNER_LESSON.watch, desc: "Видео + хадмал" },
            {
              step: "2",
              href: vocabHref,
              title: LEARNER_LESSON.vocabulary,
              desc: `${lesson.vocabularyCount} үг`,
            },
            {
              step: "3",
              href: quizHref,
              title: "Quiz",
              desc: `${lesson.quizCount} асуулт`,
            },
          ].map((item) => (
            <li key={item.step}>
              <Link
                href={item.href}
                className="flex h-full flex-col rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 transition-colors hover:bg-emerald-50"
              >
                <span className="text-xs font-bold text-emerald-600">
                  {item.step}
                </span>
                <p className="mt-1 font-semibold text-emerald-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600">{item.desc}</p>
              </Link>
            </li>
          ))}
        </ol>
      </SectionCard>

      <section className="rounded-2xl bg-emerald-50/60 p-5 ring-1 ring-emerald-100 sm:rounded-3xl sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Таны ахиц</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200">
            {statusLabel(status)}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200">
            {learnedCount} үг сурсан
          </span>
          {bestScore != null ? (
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-emerald-800 ring-1 ring-emerald-200">
              Quiz: {bestScore}%
            </span>
          ) : null}
        </div>
      </section>

      <CtaButtonRow>
        <Link href={watchHref} className={ctaPrimaryClass}>
          {LEARNER_LESSON.watch}
        </Link>
        <Link href={vocabHref} className={ctaSecondaryClass}>
          {LEARNER_LESSON.vocabularyStudy}
        </Link>
        <Link href={quizHref} className={ctaOutlineClass}>
          {LEARNER_LESSON.quiz}
        </Link>
        <Link href={coursePath(lesson.courseId)} className={ctaOutlineClass}>
          {LEARNER_LESSON.backToCourse}
        </Link>
      </CtaButtonRow>
    </>
  );
}
