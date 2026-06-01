"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { SpeakerButton } from "@/components/tts/speaker-button";
import {
  ctaOutlineClass,
  ctaPrimaryClass,
  ctaSecondaryClass,
} from "@/components/ui/cta-button-row";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { resolveVocabularyAudioUrl } from "@/lib/lesson/teaching-media";
import { vocabularyWordKey } from "@/lib/progress";
import { containsTargetScript, resolveTtsLang } from "@/lib/tts/infer-lang";
import type { HskMediaImageVariant } from "@/lib/lesson/hsk-media";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

type FlashcardProgress = {
  index: number;
  known: string[];
  review: string[];
};

type Props = {
  lesson: LessonContent;
  vocabulary: VocabularyWord[];
  adminPreview?: boolean;
  onShowList?: () => void;
  compact?: boolean;
};

const STORAGE_PREFIX = "buunduu-hsk-flashcard:";

function loadProgress(lessonId: string): FlashcardProgress {
  if (typeof window === "undefined") {
    return { index: 0, known: [], review: [] };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`);
    if (!raw) return { index: 0, known: [], review: [] };
    const parsed = JSON.parse(raw) as FlashcardProgress;
    return {
      index: Number(parsed.index) || 0,
      known: Array.isArray(parsed.known) ? parsed.known : [],
      review: Array.isArray(parsed.review) ? parsed.review : [],
    };
  } catch {
    return { index: 0, known: [], review: [] };
  }
}

function saveProgress(lessonId: string, progress: FlashcardProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${lessonId}`, JSON.stringify(progress));
  } catch {
    // ignore quota errors
  }
}

function resolveToneHint(word: VocabularyWord): string | null {
  const hint =
    word.pronunciationHintMn?.trim() ||
    word.mongolianPronunciation?.trim() ||
    word.pronunciationMn?.trim();
  return hint || null;
}

export function HskFlashcardVocabularyStudy({
  lesson,
  vocabulary,
  adminPreview = false,
  onShowList,
  compact = false,
}: Props) {
  const words = useMemo(
    () => vocabulary.filter((word) => word.chinese.trim()),
    [vocabulary]
  );
  const total = words.length;

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownKeys, setKnownKeys] = useState<Set<string>>(new Set());
  const [reviewKeys, setReviewKeys] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const saved = loadProgress(lesson.id);
    setIndex(Math.min(saved.index, Math.max(total - 1, 0)));
    setKnownKeys(new Set(saved.known));
    setReviewKeys(new Set(saved.review));
  }, [lesson.id, total]);

  const current = words[index];
  const currentKey = current ? vocabularyWordKey(current) : "";
  const ttsLang = resolveTtsLang({ courseId: lesson.courseId });
  const wordAudioUrl = current
    ? resolveVocabularyAudioUrl(current, lesson.vocabularyAudioMap)
    : undefined;

  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });
  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });

  const persist = useCallback(
    (nextIndex: number, known: Set<string>, review: Set<string>) => {
      saveProgress(lesson.id, {
        index: nextIndex,
        known: [...known],
        review: [...review],
      });
    },
    [lesson.id]
  );

  function goNext(mark?: "known" | "review") {
    if (!current) return;

    let nextKnown = knownKeys;
    let nextReview = reviewKeys;

    if (mark === "known") {
      nextKnown = new Set(knownKeys);
      nextKnown.add(currentKey);
      nextReview = new Set(reviewKeys);
      nextReview.delete(currentKey);
      setKnownKeys(nextKnown);
      setReviewKeys(nextReview);
    } else if (mark === "review") {
      nextReview = new Set(reviewKeys);
      nextReview.add(currentKey);
      setReviewKeys(nextReview);
    }

    setFlipped(false);

    if (index >= total - 1) {
      persist(index, nextKnown, nextReview);
      setCompleted(true);
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    persist(nextIndex, nextKnown, nextReview);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setCompleted(false);
    persist(0, knownKeys, reviewKeys);
  }

  const toggleFlip = useCallback(() => {
    setFlipped((value) => !value);
  }, []);

  function handleFlashcardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  }

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500">
        Энэ хичээлд үгийн сан одоогоор байхгүй байна.
      </p>
    );
  }

  if (completed || index >= total) {
    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-emerald-100">
          <p className="text-4xl" aria-hidden>
            ✨
          </p>
          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Үгийн сан дууслаа
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Мэддэг болсон: {knownKeys.size} · Дахин давтана: {reviewKeys.size}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={quizHref} className={ctaPrimaryClass}>
              Quiz өгөх
            </Link>
            <button type="button" onClick={restart} className={ctaSecondaryClass}>
              Дахин давтах
            </button>
            {onShowList ? (
              <button type="button" onClick={onShowList} className={ctaOutlineClass}>
                Жагсаалтаар харах
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const progressPct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  const toneHint = current ? resolveToneHint(current) : null;

  return (
    <div className={`flex flex-col gap-3 ${compact ? "" : "pb-4"}`}>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold text-emerald-800">
          {index + 1} / {total}
        </span>
      </div>

      <div
        className="mx-auto w-full max-w-md [perspective:1000px]"
        style={{ minHeight: compact ? "240px" : "300px" }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={toggleFlip}
          onKeyDown={handleFlashcardKeyDown}
          aria-label={flipped ? "Картын урд тал руу буцах" : "Утга, pinyin харах"}
          aria-pressed={flipped}
          className={`relative w-full cursor-pointer rounded-3xl bg-white shadow-sm ring-1 ring-emerald-100 transition-all duration-500 hover:ring-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ minHeight: compact ? "240px" : "300px" }}
        >
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-5 sm:p-6 [backface-visibility:hidden] ${
              flipped ? "invisible" : ""
            }`}
          >
            <div className="flex w-full items-start justify-end">
              {current && containsTargetScript(current.chinese) ? (
                <SpeakerButton
                  text={current.chinese}
                  lang={ttsLang}
                  courseId={lesson.courseId}
                  hskLevel={current.hskLevel}
                  audioUrl={wordAudioUrl}
                  size="md"
                  label={`Уншуулах: ${current.chinese}`}
                  stopPropagation
                />
              ) : null}
            </div>
            <p className="text-5xl font-bold leading-none text-slate-900 sm:text-6xl">
              {current?.chinese}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Мэдэхгүй бол дарж хараарай
            </p>
          </div>

          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 sm:p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
              flipped ? "" : "invisible"
            }`}
          >
            <p className="text-3xl font-bold text-slate-900">{current?.chinese}</p>
            {current?.pinyin ? (
              <p className="text-lg font-medium text-emerald-700">{current.pinyin}</p>
            ) : null}
            {current?.mongolian ? (
              <p className="text-base text-slate-700">{current.mongolian}</p>
            ) : null}
            {toneHint ? (
              <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                {toneHint}
              </span>
            ) : null}
            {current?.exampleChinese || current?.exampleMongolian ? (
              <div className="mt-2 w-full rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                {current.exampleChinese ? (
                  <p className="text-sm font-medium text-slate-900">
                    {current.exampleChinese}
                  </p>
                ) : null}
                {current.exampleMongolian ? (
                  <p className="mt-1 text-sm text-slate-600">
                    {current.exampleMongolian}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => goNext("known")}
          className="min-h-[44px] rounded-full bg-emerald-500 px-2 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 sm:text-sm"
        >
          Мэднэ
        </button>
        <button
          type="button"
          onClick={() => goNext("review")}
          className="min-h-[44px] rounded-full border border-amber-200 bg-amber-50 px-2 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:text-sm"
        >
          Дахин давтана
        </button>
        <button
          type="button"
          onClick={() => goNext()}
          className="min-h-[44px] rounded-full border border-slate-200 bg-white px-2 py-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-200 sm:text-sm"
        >
          Дараагийнх
        </button>
      </div>

      {!compact ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={quizHref} className={ctaPrimaryClass}>
            Quiz өгөх
          </Link>
          {onShowList ? (
            <button type="button" onClick={onShowList} className={ctaSecondaryClass}>
              Жагсаалтаар харах
            </button>
          ) : (
            <Link href={vocabHref} className={ctaOutlineClass}>
              Бүтэн хуудас
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

const IMAGE_VARIANT_CLASS: Record<HskMediaImageVariant, string> = {
  hero: "aspect-[3/4] min-h-[220px]",
  wide: "aspect-[16/10] min-h-[160px]",
  standard: "aspect-[4/3] min-h-[180px]",
  illustration: "aspect-[2/1] max-h-[148px] min-h-[112px]",
};

type MediaImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  packageLabel?: string;
  variant?: HskMediaImageVariant;
};

export function HskMediaImage({
  src,
  alt,
  className,
  packageLabel,
  variant = "standard",
}: MediaImageProps) {
  if (src) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl bg-emerald-50 ${className ?? ""}`}
      >
        <div className={`relative w-full ${IMAGE_VARIANT_CLASS[variant]}`}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-6 text-center ring-1 ring-emerald-100 ${className ?? ""}`}
      style={{ minHeight: "120px" }}
    >
      <span className="text-4xl" aria-hidden>
        🖼️
      </span>
      {packageLabel ? (
        <p className="mt-2 text-xs font-medium text-emerald-900">{packageLabel}</p>
      ) : null}
    </div>
  );
}
