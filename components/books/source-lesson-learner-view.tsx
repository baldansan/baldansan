"use client";

import { useState } from "react";
import { HskSourceLessonView } from "@/components/admin/source/hsk-source-lesson-view";
import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";
import type { HskSourceLesson } from "@/types/hsk-source-lesson";

/** Суралцагчид: номын агуулга хэвээр, хариултыг товчоор нээж хаана. */
export function SourceLessonLearnerView({ data }: { data: HskSourceLesson }) {
  const locale = useUiLocale();
  const [showAnswers, setShowAnswers] = useState(false);
  return (
    <div className={showAnswers ? "" : "src-hide-answers"}>
      <div className="sticky top-[calc(env(safe-area-inset-top)+2.5rem)] z-20 mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAnswers((v) => !v)}
          className={`inline-flex h-9 items-center gap-1 rounded-full px-4 text-sm font-bold shadow-sm ring-1 ${
            showAnswers ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-slate-700 ring-slate-200"
          }`}
        >
          {showAnswers ? tr(locale, "Хариулт нуух") : tr(locale, "Хариулт харах")}
        </button>
      </div>
      <div translate="no" lang="zh-CN">
        <HskSourceLessonView data={data} />
      </div>
    </div>
  );
}
