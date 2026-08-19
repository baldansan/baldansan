"use client";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";


type Props = {
  title: string;
  text: string;
};

export function LessonStepSummary({ title, text }: Props) {
  const locale = useUiLocale();
  return (
    <LessonPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
        {tr(locale, "Эхлэл")}
      </p>
      <h1 className="mt-2 text-xl font-bold leading-snug text-slate-900">
        {title}
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-700">{text}</p>
    </LessonPlayerCard>
  );
}
