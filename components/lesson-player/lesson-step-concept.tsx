"use client";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { KoreanInlinePronunciation } from "@/components/lesson/korean-pronunciation-feedback";
import { resolveHangulTextPronunciation } from "@/lib/lesson/korean-pronunciation-hints";

type Props = {
  title: string;
  content: string;
  items?: string[];
  showPronunciation?: boolean;
};

export function LessonStepConcept({
  title,
  content,
  items,
  showPronunciation = false,
}: Props) {
  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
        {content}
      </p>
      {items && items.length > 0 ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {items.map((item) => {
            const pronunciation = showPronunciation
              ? resolveHangulTextPronunciation(item)
              : null;
            return (
              <div
                key={item}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
              >
                <span className="inline-flex min-w-[2.5rem] items-center justify-center text-2xl font-bold text-slate-900">
                  {item}
                </span>
                {pronunciation ? (
                  <span className="max-w-[8rem] text-center text-[11px] font-medium leading-tight text-sky-800">
                    {pronunciation}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </LessonPlayerCard>
  );
}
