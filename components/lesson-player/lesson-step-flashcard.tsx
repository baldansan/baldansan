"use client";

import { SpeakerButton } from "@/components/tts/speaker-button";
import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";
import { getHangulVocabGroupLabel } from "@/lib/lesson/korean-vocabulary-ui";
import {
  resolveKoreanTtsLang,
  resolveVocabularyAudioUrl,
} from "@/lib/lesson/teaching-media";
import { vocabularyWordKey } from "@/lib/progress";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

type Props = {
  lesson: LessonContent;
  vocabulary: VocabularyWord[];
  cardIndex: number;
  learned: Set<string>;
  onMarkLearned: (word: VocabularyWord) => void | Promise<void>;
};

export function LessonStepFlashcard({
  lesson,
  vocabulary,
  cardIndex,
  learned,
  onMarkLearned,
}: Props) {
  const total = vocabulary.length;
  const current = vocabulary[cardIndex];
  if (!current) return null;

  const currentKey = vocabularyWordKey(current);
  const isLearned = learned.has(currentKey);
  const groupLabel = getHangulVocabGroupLabel(current);
  const ttsLang = resolveKoreanTtsLang(lesson);
  const wordAudioUrl = resolveVocabularyAudioUrl(
    current,
    lesson.vocabularyAudioMap
  );

  return (
    <LessonPlayerCard>
      <div className="flex items-center justify-center">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {cardIndex + 1} / {total}
        </span>
      </div>

      {groupLabel ? (
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {groupLabel}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col items-center text-center">
        <SpeakerButton
          text={current.chinese}
          lang={ttsLang}
          courseId={lesson.courseId}
          hskLevel={current.hskLevel}
          audioUrl={wordAudioUrl}
          size="lg"
          label={`Уншуулах: ${current.chinese}`}
        />

        <p className="mt-4 break-all text-5xl font-bold leading-none text-slate-900">
          {current.chinese}
        </p>

        {current.pinyin ? (
          <p className="mt-3 text-base text-slate-600">{current.pinyin}</p>
        ) : null}

        <p className="mt-2 text-sm font-medium text-emerald-700">
          {current.mongolian}
        </p>
      </div>

      {!isLearned ? (
        <button
          type="button"
          onClick={() => void onMarkLearned(current)}
          className="app-btn-secondary mt-6 w-full"
        >
          Сурсан гэж тэмдэглэх
        </button>
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-emerald-600">
          ✓ Сурсан
        </p>
      )}
    </LessonPlayerCard>
  );
}
