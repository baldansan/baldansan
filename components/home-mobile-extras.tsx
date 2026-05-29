"use client";

import { ContinueLearningBar } from "@/components/continue-learning-bar";
import { PwaInstallCard } from "@/components/pwa-install-card";

type Props = {
  lessonIds: string[];
};

export function HomeMobileExtras({ lessonIds }: Props) {
  return (
    <>
      <PwaInstallCard />
      <ContinueLearningBar lessonIds={lessonIds} />
    </>
  );
}
