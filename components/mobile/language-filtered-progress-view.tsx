"use client";

import { LearnerDashboard } from "@/components/learner-dashboard";
import { useLearnerLanguageLessons } from "@/hooks/use-learner-language-lessons";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function LanguageFilteredProgressView({ allLessons }: Props) {
  const { lessons, trackLabel, ready } = useLearnerLanguageLessons(allLessons);
  const lessonIds = lessons.map((lesson) => lesson.id);

  if (!ready) {
    return (
      <MobileAppShell activeTab="profile" mainClassName="mx-auto w-full max-w-[390px] lg:max-w-none">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  return (
    <LearnerDashboard
      hsk5LessonIds={lessonIds}
      trackLabel={trackLabel}
    />
  );
}
