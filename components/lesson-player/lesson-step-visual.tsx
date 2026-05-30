"use client";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { formatPronunciationLine, resolveVisualLinePronunciation } from "@/lib/lesson/korean-pronunciation-hints";

type Props = {
  title: string;
  lines: string[];
  showPronunciation?: boolean;
};

export function LessonStepVisual({ title, lines, showPronunciation = false }: Props) {
  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <div className="mt-6 space-y-5">
        {lines.map((line) => {
          const pronunciation = showPronunciation
            ? resolveVisualLinePronunciation(line)
            : null;
          const pronunciationLine = formatPronunciationLine(pronunciation);

          return (
            <div key={line} className="text-center">
              <p className="break-all text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl">
                {line}
              </p>
              {pronunciationLine ? (
                <p className="mt-2 text-sm font-medium text-sky-800">
                  {pronunciationLine}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </LessonPlayerCard>
  );
}
