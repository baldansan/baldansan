"use client";

import { LanguageFilteredProgressView } from "@/components/mobile/language-filtered-progress-view";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  allLessons: LessonContent[];
};

export function LanguageFilteredDashboard({ allLessons }: Props) {
  return <LanguageFilteredProgressView allLessons={allLessons} />;
}
