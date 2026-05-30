"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { prioritizePrelessonVocab, toGameVocabItem } from "@/lib/games/game-data-core";
import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { getHangulVocabGroupLabel } from "@/lib/lesson/korean-vocabulary-ui";
import { LEARNER_LESSON } from "@/lib/learner-labels";
import {
  resolveKoreanTtsLang,
  resolveVocabularyAudioUrl,
} from "@/lib/lesson/teaching-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { vocabularyWordKey } from "@/lib/progress";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

const AUTO_ADVANCE_MS = 700;

type Props = {
  lesson: LessonContent;
  vocabulary: VocabularyWord[];
  learned: Set<string>;
  adminPreview?: boolean;
  onMarkLearned: (word: VocabularyWord) => void | Promise<void>;
  onShowList: () => void;
};

export function VocabularyFlashcardStudy({
  lesson,
  vocabulary,
  learned,
  adminPreview = false,
  onMarkLearned,
  onShowList,
}: Props) {
  const orderedWords = useMemo(() => {
    const items = vocabulary.map(toGameVocabItem);
    const sorted = prioritizePrelessonVocab(
      items,
      isPrelessonPackage(lesson)
    );
    return sorted.map((item) => {
      const match =
        vocabulary.find((word) => vocabularyWordKey(word) === vocabularyWordKey(item)) ??
        vocabulary.find((word) => word.id === item.id) ??
        vocabulary.find((word) => word.chinese === item.chinese);
      return match ?? {
        id: item.id,
        chinese: item.chinese,
        pinyin: item.pinyin,
        mongolian: item.mongolian,
        hskLevel: item.hskLevel,
        exampleChinese: item.exampleChinese,
        exampleMongolian: item.exampleMongolian,
      };
    });
  }, [lesson, vocabulary]);

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = orderedWords.length;
  const current = orderedWords[index];
  const currentKey = current ? vocabularyWordKey(current) : "";
  const isLearned = current ? learned.has(currentKey) : false;
  const groupLabel = current ? getHangulVocabGroupLabel(current) : null;

  const ttsLang = resolveKoreanTtsLang(lesson);
  const wordAudioUrl = current
    ? resolveVocabularyAudioUrl(current, lesson.vocabularyAudioMap)
    : undefined;

  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearAdvanceTimer(), [clearAdvanceTimer]);

  useEffect(() => {
    if (index >= total && total > 0) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [index, total]);

  function goNext() {
    clearAdvanceTimer();
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    setCompleted(true);
  }

  function goPrevious() {
    clearAdvanceTimer();
    setCompleted(false);
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function restart() {
    clearAdvanceTimer();
    setCompleted(false);
    setIndex(0);
  }

  async function handleMarkLearned() {
    if (!current || isLearned) return;
    await onMarkLearned(current);
    if (index < total - 1) {
      advanceTimer.current = setTimeout(() => {
        setIndex((prev) => Math.min(prev + 1, total - 1));
        advanceTimer.current = null;
      }, AUTO_ADVANCE_MS);
    } else {
      advanceTimer.current = setTimeout(() => {
        setCompleted(true);
        advanceTimer.current = null;
      }, AUTO_ADVANCE_MS);
    }
  }

  if (total === 0) {
    return null;
  }

  if (completed || index >= total) {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 sm:p-8">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Энэ хэсгийн үсгүүдийг дуусгалаа
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {learned.size} / {total} сурсан
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={quizHref} className={ctaPrimaryClass}>
              Quiz руу
            </Link>
            <button type="button" onClick={restart} className={ctaSecondaryClass}>
              Дахин давтах
            </button>
            <button type="button" onClick={onShowList} className={ctaOutlineClass}>
              Жагсаалтаар харах
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center">
        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          {index + 1} / {total}
        </span>
      </div>

      {groupLabel ? (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
          {groupLabel}
        </p>
      ) : null}

      <article className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0 flex-1" />
            <SpeakerButton
              text={current.chinese}
              lang={ttsLang}
              courseId={lesson.courseId}
              hskLevel={current.hskLevel}
              audioUrl={wordAudioUrl}
              size="lg"
              label={`Уншуулах: ${current.chinese}`}
            />
          </div>

          <p className="mt-2 text-5xl font-bold leading-none text-slate-900 sm:text-6xl">
            {current.chinese}
          </p>
          {current.pinyin ? (
            <p className="mt-3 text-lg font-medium text-emerald-700">
              {current.pinyin}
            </p>
          ) : null}
          {current.mongolian ? (
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {current.mongolian}
            </p>
          ) : null}

          {current.exampleChinese || current.exampleMongolian ? (
            <div className="mt-6 w-full rounded-2xl bg-slate-50 p-4 text-left ring-1 ring-slate-200">
              {current.exampleChinese ? (
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                    {current.exampleChinese}
                  </p>
                  <SpeakerButton
                    text={current.exampleChinese}
                    lang={ttsLang}
                    courseId={lesson.courseId}
                    hskLevel={current.hskLevel}
                    audioUrl={wordAudioUrl}
                    size="sm"
                    label={`Жишээ уншуулах: ${current.exampleChinese}`}
                  />
                </div>
              ) : null}
              {current.exampleMongolian ? (
                <p className="mt-2 text-sm text-slate-600">
                  {current.exampleMongolian}
                </p>
              ) : null}
            </div>
          ) : null}

          {isLearned ? (
            <p className="mt-4 text-sm font-semibold text-emerald-700">
              Давталтад нэмэгдсэн ✓
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleMarkLearned();
            }}
            disabled={isLearned}
            className={
              isLearned
                ? "mt-5 min-h-[48px] w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white opacity-80"
                : "mt-5 min-h-[48px] w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            }
          >
            {isLearned ? "Сурсан" : LEARNER_LESSON.markLearned}
          </button>
        </div>
      </article>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={goPrevious}
          disabled={index === 0}
          className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Өмнөх
        </button>
        <button
          type="button"
          onClick={goNext}
          className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200"
        >
          Дараах →
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={quizHref} className={ctaPrimaryClass}>
          Quiz руу
        </Link>
        <button type="button" onClick={onShowList} className={ctaSecondaryClass}>
          Жагсаалтаар харах
        </button>
      </div>
    </div>
  );
}
