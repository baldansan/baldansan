"use client";

import { ContinueLearningBar } from "@/components/continue-learning-bar";

type Props = {
  lessonIds: string[];
};

export function Hsk5MobileExtras({ lessonIds }: Props) {
  return <ContinueLearningBar lessonIds={lessonIds} />;
}
