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
import { courseSeriesLabel } from "@/lib/lesson/course-series-label";
import { standardLessonPathStages } from "@/lib/lesson/build-lesson-path";
import { loadLessonPathProgress } from "@/lib/lesson/lesson-path-progress";
import "./lesson-fresh.css";

const PATH_STAGES = standardLessonPathStages();

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function HskLessonDetailView({ lesson, adminPreview = false }: Props) {
  const content = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const hskBadge =
    courseSeriesLabel(lesson.courseId) ??
    (content.hskLevel ? `HSK${content.hskLevel}` : "HSK");
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
  /** 7 үеийн ахиц (энэ төхөөрөмж дээрх). Хичээлд байхгүй үеийг алгассанд тооцно: хойд үе нь дууссан бол өмнөх нь дууссан. */
  const [doneStageIds, setDoneStageIds] = useState<string[]>([]);

  useEffect(() => {
    function load() {
      setStudiedCount(getStudiedWordsCount(lesson.id));
      const quizSummary = quizStepSummary(lesson.id, lesson.quizCount);
      setQuizStepLabel(
        quizSummary.status === "not_started" ? null : quizSummary.detail
      );
      setDoneStageIds(loadLessonPathProgress(lesson.id).completedStageIds);
    }
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [lesson.id, lesson.quizCount]);

  const lastDoneIndex = PATH_STAGES.reduce(
    (max, st, idx) => (doneStageIds.includes(st.id) ? idx : max),
    -1
  );
  const allDone = lastDoneIndex >= PATH_STAGES.length - 1;
  const currentIndex = allDone ? -1 : lastDoneIndex + 1;
  const ctaLabel = allDone
    ? "Дахин үзэх"
    : lastDoneIndex < 0
      ? LEARNER_LESSON.startLesson
      : `Үргэлжлүүлэх · ${PATH_STAGES[currentIndex]!.label}`;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="bs-home-hero">
        <p className="bs-home-hero-kicker">
          {hskBadge} · {duration}
        </p>
        <h1 className="bs-home-hero-zh" translate="no">{lesson.chineseTitle || lesson.title}</h1>
        {lesson.chineseTitle ? (
          <p className="bs-home-hero-mn" translate="no">{lesson.title}</p>
        ) : null}
        <p className="bs-home-hero-sub">{hskTextbookSubtitle(lesson)}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- жижиг статик зураг */}
        <img src="/temee/v3/teach.webp" alt="" className="bs-home-hero-img" />
      </div>

      <div className="bs-fresh-stats bs-home-stats">
        <div><b>{lesson.vocabularyCount}</b><span>шинэ үг</span></div>
        <div><b>{lesson.quizCount}</b><span>сорилын асуулт</span></div>
        <div><b>{PATH_STAGES.length}</b><span>үе</span></div>
      </div>

      <Link href={watchHref} className="app-btn-primary bs-home-cta">
        {ctaLabel} →
      </Link>

      <MobileCard padding="lg">
        <ol className="bs-home-path">
          {PATH_STAGES.map((st, idx) => {
            const done = allDone || idx <= lastDoneIndex;
            const cur = idx === currentIndex;
            return (
              <li key={st.id} className={done ? "is-done" : cur ? "is-cur" : undefined}>
                <span className="bs-home-path-dot">{done ? "✓" : idx + 1}</span>
                <span className="bs-home-path-label">
                  {st.label}
                  {cur ? <small>{st.hint}</small> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </MobileCard>

      <div className="bs-home-chips">
        <Link href={vocabHref}>
          🃏 Үгийн карт
          <small>
            {studiedCount > 0
              ? `${studiedCount} / ${lesson.vocabularyCount}`
              : `${lesson.vocabularyCount} үг`}
          </small>
        </Link>
        <Link href={quizHref}>
          📝 Сорил
          <small>{quizStepLabel ?? `${lesson.quizCount} асуулт`}</small>
        </Link>
      </div>

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
