"use client";

import Link from "next/link";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import { coursePath } from "@/lib/content";

export type LessonStep = "detail" | "watch" | "vocabulary" | "quiz";

type Props = {
  lessonId: string;
  courseId: string;
  current: LessonStep;
  adminPreview?: boolean;
};

const STEPS: {
  id: LessonStep;
  label: string;
  subpath?: "watch" | "vocabulary" | "quiz";
}[] = [
  { id: "detail", label: "Тойм" },
  { id: "watch", label: "Үзэх", subpath: "watch" },
  { id: "vocabulary", label: "Үг", subpath: "vocabulary" },
  { id: "quiz", label: "Quiz", subpath: "quiz" },
];

function hrefFor(
  lessonId: string,
  step: (typeof STEPS)[number],
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

function nextStep(current: LessonStep): (typeof STEPS)[number] | null {
  const idx = STEPS.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= STEPS.length - 1) return null;
  return STEPS[idx + 1];
}

export function LessonMobileStepBar({
  lessonId,
  courseId,
  current,
  adminPreview = false,
}: Props) {
  const next = nextStep(current);

  return (
    <div className="sticky bottom-20 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((step) => {
          const active = step.id === current;
          return (
            <Link
              key={step.id}
              href={hrefFor(lessonId, step, adminPreview)}
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
          href={coursePath(courseId)}
          className="min-h-[36px] rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600"
        >
          {LEARNER_LESSON.backToCourse}
        </Link>
        {next ? (
          <Link
            href={hrefFor(lessonId, next, adminPreview)}
            className="min-h-[36px] rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white"
          >
            Дараах: {next.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
