"use client";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";

type Props = {
  title: string;
  content: string;
  items?: string[];
};

export function LessonStepConcept({ title, content, items }: Props) {
  return (
    <LessonPlayerCard>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
        {content}
      </p>
      {items && items.length > 0 ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex min-w-[2.5rem] items-center justify-center rounded-xl bg-slate-50 px-3 py-2 text-2xl font-bold text-slate-900 ring-1 ring-slate-200"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </LessonPlayerCard>
  );
}
