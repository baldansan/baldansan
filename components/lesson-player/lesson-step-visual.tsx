"use client";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";

type Props = {
  title: string;
  lines: string[];
};

export function LessonStepVisual({ title, lines }: Props) {
  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <div className="mt-6 space-y-4">
        {lines.map((line) => (
          <p
            key={line}
            className="break-all text-center text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl"
          >
            {line}
          </p>
        ))}
      </div>
    </LessonPlayerCard>
  );
}
