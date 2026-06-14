"use client";

import { useLearnerLanguageLessons } from "@/hooks/use-learner-language-lessons";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import {
  ReviewDashboard,
  type LessonVocabSnapshot,
} from "@/app/review/review-dashboard";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function LanguageFilteredReviewView({ allLessons }: Props) {
  const { lessons, ready } = useLearnerLanguageLessons(allLessons);

  const snapshots: LessonVocabSnapshot[] = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    chineseTitle: lesson.chineseTitle,
    vocabulary: lesson.vocabulary,
  }));

  if (!ready) {
    return (
      <MobileAppShell activeTab="study" mainClassName="mx-auto w-full max-w-[390px]">
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  return (
    <ReviewDashboard
      lessons={snapshots}
      lessonIds={snapshots.map((lesson) => lesson.id)}
    />
  );
}
