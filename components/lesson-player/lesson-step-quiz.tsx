"use client";

import { memo } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { KoreanAnswerPronunciationBlock } from "@/components/lesson/korean-pronunciation-feedback";
import { containsTargetScript } from "@/lib/tts/infer-lang";
import type { QuizQuestion } from "@/types/lesson";
import type { VocabularyWord } from "@/types/lesson";
import type { KoreanLesson0LessonPick } from "@/lib/lesson/korean-lesson0-flow";

type Props = {
  question: QuizQuestion;
  index: number;
  total: number;
  selected: string | null;
  revealed: boolean;
  ttsLang: string;
  courseId: string;
  onSelect: (option: string) => void;
  lesson?: KoreanLesson0LessonPick;
  vocabulary?: VocabularyWord[];
  pronunciationMap?: Record<string, string>;
  showPronunciation?: boolean;
};

function shouldShowOptionSpeaker(
  option: string,
  revealed: boolean,
  selected: string | null,
  correctAnswer: string
): boolean {
  if (!containsTargetScript(option)) return false;
  if (!revealed) return false;
  return option === correctAnswer || option === selected;
}

function LessonStepQuizInner({
  question,
  index,
  total,
  selected,
  revealed,
  ttsLang,
  courseId,
  onSelect,
  lesson,
  vocabulary = [],
  pronunciationMap,
  showPronunciation = false,
}: Props) {
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
      <p className="text-sm font-medium text-emerald-700">
        Асуулт {index + 1} / {total}
      </p>
      <div className="mt-3 flex items-start gap-2">
        <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-slate-900">
          {question.question}
        </h2>
        {containsTargetScript(question.question) ? (
          <SpeakerButton
            text={question.question}
            lang={ttsLang}
            courseId={courseId}
            size="sm"
          />
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <button
              type="button"
              disabled={revealed}
              onClick={() => onSelect(option)}
              className={`${optionClass(option)} flex-1`}
            >
              {option}
            </button>
            {shouldShowOptionSpeaker(
              option,
              revealed,
              selected,
              question.correctAnswer
            ) ? (
              <SpeakerButton
                text={option}
                lang={ttsLang}
                courseId={courseId}
                size="sm"
                label={`Сонголт: ${option}`}
              />
            ) : null}
          </div>
        ))}
      </div>

      {revealed ? (
        <div
          className={
            isCorrect
              ? "mt-4 rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200"
              : "mt-4 rounded-xl bg-red-50 p-3 ring-1 ring-red-200"
          }
        >
          <p
            className={
              isCorrect
                ? "text-sm font-semibold text-emerald-800"
                : "text-sm font-semibold text-red-800"
            }
          >
            {isCorrect ? "Зөв!" : "Буруу"}
          </p>
          {showPronunciation && lesson ? (
            <KoreanAnswerPronunciationBlock
              correctAnswer={question.correctAnswer}
              explanation={question.explanation}
              lesson={lesson}
              vocabulary={vocabulary}
              pronunciationMap={pronunciationMap}
              showPronunciation
              className="mt-2"
            />
          ) : (
            <p className="mt-1 text-sm text-slate-700">{question.explanation}</p>
          )}
        </div>
      ) : null}
    </LessonPlayerCard>
  );
}

export const LessonStepQuiz = memo(LessonStepQuizInner);

export function LessonStepQuizIntro({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <LessonPlayerCard>
      <p className="text-4xl text-center" aria-hidden>
        ✓
      </p>
      <h1 className="mt-3 text-center text-xl font-bold text-slate-900">
        {title}
      </h1>
      <p className="mt-3 text-center text-sm leading-6 text-slate-600">
        {text}
      </p>
    </LessonPlayerCard>
  );
}
