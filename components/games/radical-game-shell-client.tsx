"use client";

import { useState } from "react";
import { RadicalChallengeClient } from "@/components/games/radical-challenge-client";
import { RadicalGameClient } from "@/components/games/radical-game-client";
import type { RadicalGameEntry } from "@/lib/games/radical-game-data";

type Props = {
  lessonId: string;
  entries: RadicalGameEntry[];
  returnHref?: string;
  customWordSet?: boolean;
  initialChallenge?: boolean;
};

export function RadicalGameShellClient({
  lessonId,
  entries,
  returnHref,
  customWordSet = false,
  initialChallenge = false,
}: Props) {
  const [challengeMode, setChallengeMode] = useState(initialChallenge);

  if (challengeMode) {
    return (
      <RadicalChallengeClient
        lessonId={lessonId}
        onExitChallenge={() => setChallengeMode(false)}
      />
    );
  }

  return (
    <RadicalGameClient
      lessonId={lessonId}
      entries={entries}
      returnHref={returnHref}
      customWordSet={customWordSet}
      onEnterChallenge={() => setChallengeMode(true)}
    />
  );
}
