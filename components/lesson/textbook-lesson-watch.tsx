"use client";

import Link from "next/link";
import { useEffect } from "react";
import { markLessonStartedSmart } from "@/lib/progress";
import { LessonMobileStepBar } from "@/components/lesson-mobile-step-bar";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { LearnerPageShell } from "@/components/ui/page-shell";
import {
  CtaButtonRow,
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import { MobileCard } from "@/components/mobile/mobile-card";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { isDirectAudioUrl } from "@/lib/media-url";
import { hasAudioUrl } from "@/lib/lesson-media";
import { KoreanTeachingVisuals } from "@/components/lesson/korean-teaching-visuals";
import { inferLessonLanguage } from "@/lib/language-track";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

function overviewText(lesson: LessonContent): string | null {
  const text = lesson.description?.trim() || lesson.subtitle?.trim();
  return text || null;
}

export function TextbookLessonWatchClient({
  lesson,
  adminPreview = false,
}: Props) {
  const audioReady = hasAudioUrl(lesson);
  const audioUrl = lesson.audioUrl;
  const overview = overviewText(lesson);

  useEffect(() => {
    void markLessonStartedSmart(lesson.id);
  }, [lesson.id]);

  const detailHref = lessonPreviewPath(lesson.id, { adminPreview });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });
  const isKorean = inferLessonLanguage(lesson) === "ko";

  return (
    <LearnerPageShell activeTab="home">
      {adminPreview ? <AdminPreviewBanner /> : null}

      <section>
        <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        {lesson.chineseTitle ? (
          <p className="mt-1 text-lg text-slate-700">{lesson.chineseTitle}</p>
        ) : null}
      </section>

      {overview ? (
        <SectionCard>
          <h2 className="text-sm font-semibold text-slate-900">Тойм</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{overview}</p>
        </SectionCard>
      ) : null}

      {audioReady && audioUrl && isDirectAudioUrl(audioUrl) ? (
        <MobileCard>
          <h2 className="text-sm font-semibold text-[var(--app-text)]">Audio</h2>
          <audio controls className="mt-2 w-full" src={audioUrl} />
        </MobileCard>
      ) : null}

      {isKorean ? (
        <KoreanTeachingVisuals
          teachingImages={lesson.teachingImages}
          showFallbackDiagram
        />
      ) : null}

      <CtaButtonRow>
        <Link href={vocabHref} className={ctaPrimaryClass}>
          {LEARNER_LESSON.nextVocabulary}
        </Link>
        <Link href={quizHref} className={ctaSecondaryClass}>
          {LEARNER_LESSON.nextQuiz}
        </Link>
        <Link href={detailHref} className={ctaOutlineClass}>
          {LEARNER_LESSON.backToLesson}
        </Link>
      </CtaButtonRow>

      <LessonMobileStepBar
        lesson={lesson}
        current="watch"
        adminPreview={adminPreview}
      />
    </LearnerPageShell>
  );
}
