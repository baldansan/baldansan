"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GamePracticeLinks } from "@/components/games/game-practice-links";
import { HskOptionalVideoCard } from "@/components/lesson/hsk-optional-video-card";
import { LessonProgressCard } from "@/components/lesson-progress-card";
import { MobileCard } from "@/components/mobile/mobile-card";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { coursePath } from "@/lib/content";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { inferLessonLanguage } from "@/lib/language-track";
import {
  parseHskStudyContentFromLesson,
} from "@/lib/lesson/hsk-lesson-content";
import { hskTextbookSubtitle } from "@/lib/lesson/hsk-learner-copy";
import { hskVocabularyStudyCtaLabel } from "@/lib/lesson/hsk-vocabulary-ui";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { quizStepSummary, getStudiedWordsCount } from "@/lib/lesson/bs-step-progress";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function HskLessonDetailView({ lesson, adminPreview = false }: Props) {
  const content = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const hskBadge = content.hskLevel ? `HSK${content.hskLevel}` : "HSK";
  const duration = lesson.duration?.trim() || "5–10 мин";
  const isPrelesson = isPrelessonPackage(lesson);
  const isKorean = inferLessonLanguage(lesson) === "ko";

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

  const [studiedCount, setStudiedCount] = useState(0);
  const [quizStepLabel, setQuizStepLabel] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      setStudiedCount(getStudiedWordsCount(lesson.id));
      const quizSummary = quizStepSummary(lesson.id, lesson.quizCount);
      setQuizStepLabel(
        quizSummary.status === "not_started" ? null : quizSummary.detail
      );
    }
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [lesson.id, lesson.quizCount]);

  const steps = [
    {
      step: "1",
      href: watchHref,
      icon: "📖",
      title: "Хичээл судлах",
      desc: "Багшийн тайлбар, pinyin, tone",
    },
    {
      step: "2",
      href: vocabHref,
      icon: "🃏",
      title: "Картаар сурах",
      desc:
        studiedCount > 0
          ? `${studiedCount} / ${lesson.vocabularyCount} үг сурсан`
          : `${lesson.vocabularyCount} үг · flashcard`,
    },
    {
      step: "3",
      href: quizHref,
      icon: "✓",
      title: "Quiz",
      desc: quizStepLabel ?? `${lesson.quizCount} асуулт`,
    },
    {
      step: "4",
      href: `/games/match?lessonId=${lesson.id}`,
      icon: "🎮",
      title: "Дасгал / тоглоом",
      desc: "Холбох, орчуулах",
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <MobileCard padding="lg" className="!bg-gradient-to-br !from-emerald-50 !to-teal-50/80 !ring-emerald-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            {hskBadge}
          </span>
          <span className="text-xs text-slate-600">{duration}</span>
        </div>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.chineseTitle ? (
          <p className="mt-0.5 text-lg text-emerald-800">{lesson.chineseTitle}</p>
        ) : null}
      </MobileCard>

      <MobileCard padding="lg" className="!ring-emerald-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Номын хичээл
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
          {hskTextbookSubtitle(lesson)}
        </p>
        <Link href={watchHref} className="app-btn-primary mt-4 w-full">
          📖 {LEARNER_LESSON.startLesson}
        </Link>
      </MobileCard>

      <MobileCard padding="lg">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Хичээлийн алхам</h2>
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
                    <p className="font-semibold text-[var(--app-text)]">{item.title}</p>
                    <p className="text-xs text-[var(--app-muted)]">{item.desc}</p>
                  </div>
                  <span className="text-[var(--app-muted)]">›</span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </MobileCard>

      <LessonProgressCard lessonId={lesson.id} quizCount={lesson.quizCount} />

      <HskOptionalVideoCard lesson={lesson} adminPreview={adminPreview} />

      <MobileCard padding="lg" className="!border-purple-100">
        <h2 className="text-sm font-bold text-[var(--app-text)]">Тоглоомоор давтах</h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Энэ хичээлийн үгээр холбох, орчуулах тоглоом тогло.
        </p>
        <GamePracticeLinks
          lessonId={lesson.id}
          isKorean={isKorean}
          isPrelesson={isPrelesson}
          include={["match", "translate", "arrange"] as const}
        />
      </MobileCard>

      <Link
        href={coursePath(lesson.courseId)}
        className="block text-center text-sm font-medium text-[var(--app-muted)] hover:text-emerald-600"
      >
        ← {LEARNER_LESSON.backToCourse}
      </Link>
    </div>
  );
}
