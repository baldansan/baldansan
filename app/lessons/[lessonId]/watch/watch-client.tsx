"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markLessonStartedSmart } from "@/lib/progress";
import { LessonMobileStepBar } from "@/components/lesson-mobile-step-bar";
import { LessonWatchMediaSection } from "@/components/lesson-media-display";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import { LearnerPageShell } from "@/components/ui/page-shell";
import {
  CtaButtonRow,
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { SectionCard } from "@/components/ui/section-card";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import type { LessonContent } from "@/types/lesson-content";
import type { SubtitleMode, TimedSubtitle } from "@/types/lesson";

const modes: { id: SubtitleMode; label: string }[] = [
  { id: "chinese", label: "Хятад" },
  { id: "mongolian", label: "Монгол" },
  { id: "both", label: "Хоёул" },
];

function SubtitleLines({
  line,
  mode,
}: {
  line: TimedSubtitle;
  mode: SubtitleMode;
}) {
  if (mode === "mongolian") {
    return <p className="text-sm leading-6 text-slate-700">{line.mongolian}</p>;
  }

  return (
    <>
      <p className="text-base font-medium leading-snug text-slate-900 break-words">
        {line.chinese}
      </p>
      {(mode === "chinese" || mode === "both") && (
        <p className="mt-1 text-sm text-emerald-700">{line.pinyin}</p>
      )}
      {mode === "both" && (
        <p className="mt-2 text-sm leading-6 text-slate-600">{line.mongolian}</p>
      )}
    </>
  );
}

type Props = {
  lesson: LessonContent;
  adminPreview?: boolean;
};

export function LessonWatchClient({ lesson, adminPreview = false }: Props) {
  const [mode, setMode] = useState<SubtitleMode>("both");

  useEffect(() => {
    void markLessonStartedSmart(lesson.id);
  }, [lesson.id]);

  return (
    <LearnerPageShell activeTab="home">
      {adminPreview ? <AdminPreviewBanner /> : null}
      <Link
        href={lessonPreviewPath(lesson.id, { adminPreview })}
        className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
      >
        ← {LEARNER_LESSON.backToLesson}
      </Link>

      <section>
        <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-3xl">
          {LEARNER_LESSON.watch} — {lesson.title}
        </h1>
        <p className="mt-1 text-lg text-slate-700">{lesson.chineseTitle}</p>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Хадмал горим сонгоод, сонсож уншаарай.
        </p>
      </section>

      <LessonWatchMediaSection lesson={lesson} />

      <section className="rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200 sm:rounded-3xl sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Зөвлөмж
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Эхлээд «Хоёул» горимоор уншаад, дараа нь «Хятад» горим дээр shadowing
          хийгээрэй.
        </p>
      </section>

      <SectionCard>
        <h2 className="text-sm font-semibold text-slate-900">Хадмал горим</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={
                mode === item.id
                  ? "min-h-[44px] flex-1 rounded-full bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white sm:flex-none sm:px-5"
                  : "min-h-[44px] flex-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 sm:flex-none sm:px-5"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <section className="flex flex-col gap-3">
        {lesson.timedSubtitles.map((line, index) => (
          <article
            key={`${line.start}-${line.chinese}`}
            className={
              index === 0
                ? "rounded-2xl bg-emerald-50/80 p-4 ring-2 ring-emerald-300 sm:rounded-3xl sm:p-5"
                : "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-5"
            }
          >
            <p className="text-xs font-medium text-emerald-700">
              {line.start} – {line.end}
            </p>
            <div className="mt-3">
              <SubtitleLines line={line} mode={mode} />
            </div>
          </article>
        ))}
      </section>

      <CtaButtonRow>
        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "vocabulary",
          })}
          className={ctaSecondaryClass}
        >
          {LEARNER_LESSON.nextVocabulary}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, {
            adminPreview,
            subpath: "quiz",
          })}
          className={ctaPrimaryClass}
        >
          {LEARNER_LESSON.nextQuiz}
        </Link>
        <Link
          href={lessonPreviewPath(lesson.id, { adminPreview })}
          className={ctaOutlineClass}
        >
          {LEARNER_LESSON.backToLesson}
        </Link>
      </CtaButtonRow>

      <LessonMobileStepBar
        lessonId={lesson.id}
        courseId={lesson.courseId}
        current="watch"
        adminPreview={adminPreview}
      />
    </LearnerPageShell>
  );
}
