"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileCard } from "@/components/mobile/mobile-card";
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
  isExamContent,
  isTextbookContent,
} from "@/lib/lesson-content-type";
import {
  isKoreanFlashcardVocabularyLesson,
  koreanVocabularyStudyCtaLabel,
} from "@/lib/lesson/korean-vocabulary-ui";
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

  const textbook = isTextbookContent(lesson);
  const exam = isExamContent(lesson);
  const koreanFlashcard = isKoreanFlashcardVocabularyLesson(
    lesson,
    lesson.vocabulary
  );
  const vocabStepTitle = koreanFlashcard
    ? koreanVocabularyStudyCtaLabel(lesson)
    : LEARNER_LESSON.vocabulary;
  const vocabStudyCta = koreanFlashcard
    ? koreanVocabularyStudyCtaLabel(lesson)
    : LEARNER_LESSON.vocabularyStudy;

  const steps = [
    {
      step: "1",
      href: watchHref,
      icon: textbook ? "📖" : exam ? "📝" : "▶",
      title: textbook
        ? "Хичээл судлах"
        : exam
          ? "Шалгалтын тойм"
          : LEARNER_LESSON.watch,
      desc: textbook
        ? "Тойм + сурах"
        : exam
          ? `${lesson.quizCount} асуулт`
          : "Видео + хадмал",
    },
    {
      step: "2",
      href: vocabHref,
      icon: "📚",
      title: vocabStepTitle,
      desc: koreanFlashcard
        ? `${lesson.vocabularyCount} үсэг/үг`
        : `${lesson.vocabularyCount} үг`,
    },
    {
      step: "3",
      href: quizHref,
      icon: "✓",
      title: "Quiz",
      desc: `${lesson.quizCount} асуулт`,
    },
  ];

  return (
    <>
      <MobileCard padding="lg">
        <h2 className="text-sm font-bold text-[var(--app-text)]">
          Хичээлийн алхам
        </h2>
        <ol className="app-lesson-step-grid mt-3">
          {steps.map((item) => (
            <li key={item.step}>
              <Link href={item.href} className="app-lesson-step-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Алхам {item.step}
                    </p>
                    <p className="font-semibold text-[var(--app-text)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--app-muted)]">{item.desc}</p>
                  </div>
                  <span className="text-[var(--app-muted)]">›</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </MobileCard>

      <MobileCard className="!bg-emerald-50/50">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Таны ахиц</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="app-stat-pill">{statusLabel(status)}</span>
          <span className="app-stat-pill">{learnedCount} үг сурсан</span>
          {bestScore != null ? (
            <span className="app-stat-pill app-stat-pill-accent">
              Quiz: {bestScore}%
            </span>
          ) : null}
        </div>
      </MobileCard>

      <div className="app-lesson-cta-row">
        <Link href={watchHref} className="app-btn-primary col-span-2 w-full">
          {textbook ? "📖 Хичээл судлах" : exam ? "📝 Шалгалт" : `▶ ${LEARNER_LESSON.watch}`}
        </Link>
        <Link href={vocabHref} className="app-btn-secondary w-full">
          📚 {vocabStudyCta}
        </Link>
        <Link href={quizHref} className="app-btn-outline-green w-full">
          ✓ {LEARNER_LESSON.quiz}
        </Link>
      </div>

      <Link
        href={coursePath(lesson.courseId)}
        className="block text-center text-sm font-medium text-[var(--app-muted)] hover:text-emerald-600"
      >
        ← {LEARNER_LESSON.backToCourse}
      </Link>
    </>
  );
}
