"use client";

import { tr } from "@/lib/i18n/translate";
import { useUiLocale } from "@/lib/i18n/ui-locale";



import { SpeakerButton } from "@/components/tts/speaker-button";

import { LessonPlayerCard } from "@/components/lesson-player/lesson-player-shell";

import {

  MongolianMeaningHint,

  MongolianPronunciationHint,

} from "@/components/lesson/mongolian-pronunciation-hint";

import { getHangulVocabGroupLabel } from "@/lib/lesson/korean-vocabulary-ui";

import {

  resolveDisplayPronunciation,

  resolveVocabMeaningLabel,

} from "@/lib/lesson/korean-pronunciation-hints";

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

  screenTitle?: string;

  showPronunciation?: boolean;

  onMarkLearned: (word: VocabularyWord) => void | Promise<void>;

};



export function LessonStepFlashcard({

  lesson,

  vocabulary,

  cardIndex,

  learned,

  screenTitle,

  showPronunciation = false,

  onMarkLearned,

}: Props) {
  const locale = useUiLocale();

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

  const pronunciation = showPronunciation

    ? resolveDisplayPronunciation(current, lesson, lesson.vocabularyPronunciationMap)

    : null;

  const meaning = showPronunciation

    ? resolveVocabMeaningLabel(current, pronunciation)

    : current.mongolian?.trim() || null;



  return (

    <LessonPlayerCard>

      {screenTitle ? (

        <p className="text-center text-sm font-bold text-emerald-700">

          {screenTitle}

        </p>

      ) : null}

      <div className={`flex items-center justify-center ${screenTitle ? "mt-3" : ""}`}>

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

          label={`${tr(locale, "Уншуулах:")} ${current.chinese}`}

        />



        <p className="mt-4 break-all text-5xl font-bold leading-none text-slate-900">

          {current.chinese}

        </p>



        {current.pinyin ? (

          <p className="mt-3 text-base font-medium text-slate-600">{current.pinyin}</p>

        ) : null}



        {showPronunciation ? (

          <MongolianPronunciationHint

            pronunciation={pronunciation}

            className="mt-3"

          />

        ) : null}



        {showPronunciation ? (

          <MongolianMeaningHint meaning={meaning} className="mt-3" />

        ) : current.mongolian ? (

          <p className="mt-2 text-sm font-medium text-emerald-700">{current.mongolian}</p>

        ) : null}

      </div>



      {!isLearned ? (

        <button

          type="button"

          onClick={() => void onMarkLearned(current)}

          className="app-btn-secondary mt-6 w-full"

        >

          {tr(locale, "Сурсан гэж тэмдэглэх")}

        </button>

      ) : (

        <p className="mt-6 text-center text-sm font-semibold text-emerald-600">

          ✓ {tr(locale, "Сурсан")}

        </p>

      )}

    </LessonPlayerCard>

  );

}


