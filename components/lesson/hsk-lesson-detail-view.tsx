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
import {
  getLearnedWordsSmart,
  getLessonStatusSmart,
  getQuizResultSmart,
  type LessonStatus,
} from "@/lib/progress";
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
      desc: `${lesson.vocabularyCount} үг · flashcard`,
    },
    {
      step: "3",
      href: quizHref,
      icon: "✓",
      title: "Quiz",
      desc: `${lesson.quizCount} асуулт`,
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

      <LessonProgressCard lessonId={lesson.id} />

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
