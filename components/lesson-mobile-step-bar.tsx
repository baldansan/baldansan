"use client";

import Link from "next/link";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { coursePath } from "@/lib/content";
import {
  resolveLessonContentType,
  watchStepLabel,
} from "@/lib/lesson-content-type";
import type { LessonContent } from "@/types/lesson-content";

export type LessonStep = "detail" | "watch" | "vocabulary" | "quiz";

type Props = {
  lesson: LessonContent;
  current: LessonStep;
  adminPreview?: boolean;
};

function buildSteps(contentType: ReturnType<typeof resolveLessonContentType>) {
  const watchLabel = watchStepLabel(contentType);
  return [
    { id: "detail" as const, label: "Тойм" },
    { id: "watch" as const, label: watchLabel, subpath: "watch" as const },
    { id: "vocabulary" as const, label: "Үг", subpath: "vocabulary" as const },
    { id: "quiz" as const, label: "Quiz", subpath: "quiz" as const },
  ];
}

function hrefFor(
  lessonId: string,
  step: ReturnType<typeof buildSteps>[number],
  adminPreview: boolean
) {
  if (step.id === "detail") {
    return lessonPreviewPath(lessonId, { adminPreview });
  }
  return lessonPreviewPath(lessonId, {
    adminPreview,
    subpath: step.subpath!,
  });
}

function nextStep(
  steps: ReturnType<typeof buildSteps>,
  current: LessonStep
): ReturnType<typeof buildSteps>[number] | null {
  const idx = steps.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= steps.length - 1) return null;
  return steps[idx + 1];
}

type LegacyProps = {
  lessonId: string;
  courseId: string;
  current: LessonStep;
  adminPreview?: boolean;
};

/** Accepts full lesson (preferred) or legacy lessonId + courseId. */
export function LessonMobileStepBar(props: Props | LegacyProps) {
  const lesson =
    "lesson" in props
      ? props.lesson
      : ({
          id: props.lessonId,
          courseId: props.courseId,
        } as Pick<LessonContent, "id" | "courseId">);

  const { current, adminPreview = false } = props;
  const contentType = resolveLessonContentType(lesson as LessonContent);
  const steps = buildSteps(contentType);
  const next = nextStep(steps, current);

  return (
    <div className="sticky bottom-20 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {steps.map((step) => {
          const active = step.id === current;
          return (
            <Link
              key={step.id}
              href={hrefFor(lesson.id, step, adminPreview)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold min-h-[36px] flex items-center ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {step.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={coursePath(lesson.courseId)}
          className="min-h-[36px] rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
        >
          {LEARNER_LESSON.backToCourse}
        </Link>
        {next ? (
          <Link
            href={hrefFor(lesson.id, next, adminPreview)}
            className="min-h-[36px] rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white"
          >
            Дараах: {next.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
