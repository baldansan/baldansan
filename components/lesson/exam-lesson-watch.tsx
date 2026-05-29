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
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import { MobileCard } from "@/components/mobile/mobile-card";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { isDirectAudioUrl } from "@/lib/media-url";
import { hasAudioUrl } from "@/lib/lesson-media";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function ExamLessonWatchClient({ lesson, adminPreview = false }: Props) {
  const audioReady = hasAudioUrl(lesson);
  const audioUrl = lesson.audioUrl;

  useEffect(() => {
    void markLessonStartedSmart(lesson.id);
  }, [lesson.id]);

  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  return (
    <LearnerPageShell activeTab="home">
      {adminPreview ? <AdminPreviewBanner /> : null}

      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Шалгалт
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        {lesson.chineseTitle ? (
          <p className="mt-1 text-lg text-slate-700">{lesson.chineseTitle}</p>
        ) : null}
      </section>

      <MobileCard className="!border-amber-200 !bg-amber-50/60">
        <h2 className="text-sm font-bold text-[var(--app-text)]">
          Шалгалт эхлүүлэх
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="app-stat-pill">{lesson.quizCount} асуулт</span>
          {lesson.duration ? (
            <span className="app-stat-pill">⏱ {lesson.duration}</span>
          ) : null}
        </div>
        {lesson.description ? (
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {lesson.description}
          </p>
        ) : null}
      </MobileCard>

      <SectionCard>
        <h2 className="text-sm font-semibold text-slate-900">Хэсгүүд</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Асуултууд — {lesson.quizCount}</li>
          {lesson.quizTypes.map((type) => (
            <li key={type}>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {type}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <MobileCard className="!border-slate-200 !bg-slate-50/80">
        <h2 className="text-sm font-semibold text-slate-900">⏱ Хугацаа</h2>
        <p className="mt-2 text-sm text-slate-600">
          {lesson.duration
            ? `${lesson.duration} — шалгалт эхлэхэд тоолуур энд харагдана.`
            : "Шалгалт эхлэхэд тоолуур энд харагдана."}
        </p>
      </MobileCard>

      <MobileCard className="!border-slate-200 !bg-slate-50/80">
        <h2 className="text-sm font-semibold text-slate-900">Оноо / дүгнэлт</h2>
        <p className="mt-2 text-sm text-slate-600">
          Шалгалт дууссаны дараа оноо болон хариултын дүгнэлтүүд энд харагдана.
        </p>
      </MobileCard>

      {audioReady && audioUrl && isDirectAudioUrl(audioUrl) ? (
        <MobileCard>
          <h2 className="text-sm font-semibold text-[var(--app-text)]">
            Сонсох хэсэг
          </h2>
          <audio controls className="mt-2 w-full" src={audioUrl} />
        </MobileCard>
      ) : null}

      <CtaButtonRow>
        <Link href={quizHref} className={ctaPrimaryClass}>
          Шалгалт эхлүүлэх
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview })}
          className={ctaOutlineClass}
        >
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
