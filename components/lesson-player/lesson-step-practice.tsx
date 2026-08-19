"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { KoreanAnswerPronunciationBlock } from "@/components/lesson/korean-pronunciation-feedback";
import type { PracticeQuestion } from "@/types/lesson-player";
import type { VocabularyWord } from "@/types/lesson";
import type { KoreanLesson0LessonPick } from "@/lib/lesson/korean-lesson0-flow";

type Props = {
  title: string;
  question: PracticeQuestion;
  questionIndex: number;
  total: number;
  selected: string | null;
  revealed: boolean;
  onSelect: (option: string) => void;
  lesson: KoreanLesson0LessonPick;
  vocabulary?: VocabularyWord[];
  pronunciationMap?: Record<string, string>;
  showPronunciation?: boolean;
};

export function LessonStepPractice({
  title,
  question,
  questionIndex,
  total,
  selected,
  revealed,
  onSelect,
  lesson,
  vocabulary = [],
  pronunciationMap,
  showPronunciation = false,
}: Props) {
  const locale = useUiLocale();
  const isCorrect = selected === question.correctAnswer;

  function optionClass(option: string) {
    const base =
      "min-h-[48px] w-full rounded-xl px-4 py-3 text-left text-sm font-medium";
    if (!revealed) {
      return selected === option
        ? `${base} bg-emerald-500 text-white ring-2 ring-emerald-400`
        : `${base} border border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:bg-emerald-50`;
    }
    if (option === question.correctAnswer) {
      return `${base} bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400`;
    }
    if (option === selected) {
      return `${base} bg-red-50 text-red-700 ring-2 ring-red-300`;
    }
    return `${base} border border-slate-200 bg-slate-50 text-slate-500`;
  }

  return (
    <LessonPlayerCard>
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {tr(locale, "Дасгал")} {questionIndex + 1} / {total}
      </p>
      <h2 className="mt-4 text-lg font-bold leading-snug text-slate-900">
        {question.prompt}
      </h2>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={revealed}
            onClick={() => onSelect(option)}
            className={optionClass(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {revealed ? (
        <div
          className={
            isCorrect
              ? "mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200"
              : "mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200"
          }
        >
          <p className="font-semibold">{tr(locale, isCorrect ? "Зөв!" : "Буруу")}</p>
          {!isCorrect ? (
            <p className="mt-1">{tr(locale, "Зөв хариулт:")}</p>
          ) : null}
          <KoreanAnswerPronunciationBlock
            correctAnswer={question.correctAnswer}
            explanation={question.explanation}
            lesson={lesson}
            vocabulary={vocabulary}
            pronunciationMap={pronunciationMap}
            showPronunciation={showPronunciation}
            className="mt-1"
          />
        </div>
      ) : null}
    </LessonPlayerCard>
  );
}
