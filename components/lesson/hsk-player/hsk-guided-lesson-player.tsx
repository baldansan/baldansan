"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import {
  CharactersLessonCard,
  CommonMistakesCard,
  DialoguePracticeCard,
  KeyPhraseCard,
  LessonCompleteCard,
  PhraseBreakdownCard,
  PracticeMenuCard,
  PinyinPracticeCard,
  TeacherSpeechCard,
  TonePracticeCard,
  ToneSandhiCard,
  GuidedStepCard,
  HskOptionalVideoInline,
  VocabularyFlashcardPreview,
} from "@/components/lesson/hsk-player/hsk-player-cards";
import { lessonPlayerPrimaryBtnClass } from "@/components/lesson-player/lesson-player-shell";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { buildHskPlayerContent } from "@/lib/lesson/hsk-player/build-hsk-player-content";
import { buildHskPlayerStepPlanFromLesson } from "@/lib/lesson/hsk-player/build-hsk-guided-steps";
import type { HskGuidedStep } from "@/lib/lesson/hsk-guided-step";
import {
  parseHskToneItems,
  parseToneItemsFromGuidedStep,
} from "@/lib/lesson/hsk-tone-content";
import type { HskGuidedStepMediaRef } from "@/lib/lesson/hsk-media";
import { HSK_PLAYER } from "@/lib/lesson/hsk-player/hsk-player-theme";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { markLessonCompletedSmart, markLessonStartedSmart } from "@/lib/progress";
import type { LessonContent } from "@/types/lesson-content";

type Props = {
  lesson: LessonContent;
  nextLessonId: string | null;
  adminPreview?: boolean;
  routeLessonId: string;
};

const STORAGE_PREFIX = "buunduu-hsk-player:";

function stepMediaRef(step: HskGuidedStep): HskGuidedStepMediaRef {
  return {
    imageId: step.imageId,
    mediaSection: step.mediaSection,
    id: step.id,
  };
}

function loadStep(lessonId: string, maxIndex: number): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`);
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(Math.max(0, n), maxIndex) : 0;
  } catch {
    return 0;
  }
}

function saveStep(lessonId: string, step: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${lessonId}`, String(step));
  } catch {
    // ignore
  }
}

export function HskGuidedLessonPlayer({
  lesson,
  nextLessonId,
  adminPreview = false,
  routeLessonId,
}: Props) {
  const router = useRouter();
  const content = useMemo(() => buildHskPlayerContent(lesson), [lesson]);
  const stepPlan = useMemo(() => buildHskPlayerStepPlanFromLesson(lesson), [lesson]);
  const totalSteps = stepPlan.totalSteps;

  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const currentStep = stepPlan.steps[stepIndex] ?? null;

  const vocabHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "vocabulary",
  });
  const quizHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "quiz",
  });
  const workbookHref = lessonPreviewPath(lesson.id, {
    adminPreview,
    subpath: "workbook",
  });
  const detailHref = lessonPreviewPath(lesson.id, { adminPreview });
  const nextHref = nextLessonId
    ? lessonPreviewPath(nextLessonId, { adminPreview })
    : null;

  useEffect(() => {
    setStepIndex(loadStep(routeLessonId, Math.max(0, totalSteps - 1)));
    setHydrated(true);
  }, [routeLessonId, totalSteps]);

  useEffect(() => {
    if (!hydrated) return;
    void markLessonStartedSmart(lesson.id);
  }, [hydrated, lesson.id]);

  const persistStep = useCallback(
    (next: number) => {
      setStepIndex(next);
      saveStep(routeLessonId, next);
    },
    [routeLessonId]
  );

  function handleClose() {
    router.push(detailHref);
  }

  function handleRestart() {
    persistStep(0);
  }

  function goNext() {
    if (stepIndex >= totalSteps - 1) return;
    persistStep(stepIndex + 1);
  }

  function goPrevious() {
    if (stepIndex <= 0) return;
    persistStep(stepIndex - 1);
  }

  useEffect(() => {
    if (stepIndex === totalSteps - 1) {
      void markLessonCompletedSmart(lesson.id);
    }
  }, [stepIndex, totalSteps, lesson.id]);

  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const isLastStep = stepIndex >= totalSteps - 1;

  if (!hydrated) {
    return (
      <MobileAppShell activeTab="study" showBottomNav={false}>
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Хичээл ачаалж байна...
        </p>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav={false}
      mainClassName="max-w-[430px] mx-auto w-full font-sans"
    >
      {adminPreview ? <AdminPreviewBanner /> : null}

      <div className="flex min-h-[calc(100dvh-2rem)] flex-col pb-4">
        <header className="mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-slate-200"
              aria-label="Буцах"
            >
              ←
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold" style={{ color: HSK_PLAYER.text }}>
                {lesson.title}
              </p>
              {lesson.chineseTitle ? (
                <p className="truncate text-xs" style={{ color: HSK_PLAYER.muted }}>
                  {lesson.chineseTitle}
                </p>
              ) : null}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, backgroundColor: HSK_PLAYER.primary }}
                />
              </div>
              <p className="mt-1 text-center text-[11px] font-semibold" style={{ color: HSK_PLAYER.muted }}>
                Алхам {stepIndex + 1} / {totalSteps}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="shrink-0 text-xs font-medium text-slate-500 hover:text-emerald-600"
            >
              ↺
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {currentStep?.type === "teacher-intro" ? (
            <TeacherSpeechCard
              title={currentStep.titleMn || "Багшийн тайлбар"}
              bullets={
                currentStep.bulletsMn.length > 0
                  ? currentStep.bulletsMn
                  : content.introBullets
              }
              tip={currentStep.teacherSpeechMn || content.teacherTip}
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "key-phrase" ? (
            <KeyPhraseCard
              lesson={lesson}
              chinese={currentStep.chinese || content.keyPhrase.chinese}
              pinyin={currentStep.pinyin || content.keyPhrase.pinyin}
              mongolian={currentStep.mongolian || content.keyPhrase.mongolian}
              breakdown={content.keyPhrase.breakdown}
              usage={content.keyPhrase.usage}
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "pinyin" ? (
            <PinyinPracticeCard
              lesson={lesson}
              explainer={
                currentStep.bulletsMn.length > 0
                  ? currentStep.bulletsMn
                  : content.pinyinExplainer
              }
              rows={
                currentStep.examples.length > 0
                  ? currentStep.examples.map((row) => ({
                      chinese: row.chinese ?? "",
                      pinyin: row.pinyin ?? "",
                      hint: row.mongolian ?? row.label,
                    }))
                  : content.pinyinRows
              }
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "tones" ? (
            <TonePracticeCard
              tones={(() => {
                const fromStep = parseToneItemsFromGuidedStep(currentStep);
                if (fromStep.length > 0) return fromStep;
                return parseHskToneItems(content.tones);
              })()}
              layout={currentStep.toneLayout}
              toneNote={currentStep.teacherSpeechMn || content.toneNote}
              toneWarning={content.toneWarning}
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "vocabulary" ? (
            <VocabularyFlashcardPreview
              lesson={lesson}
              word={content.featuredWord}
              vocabHref={`${vocabHref}?view=flashcard`}
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "dialogue" ? (
            <DialoguePracticeCard
              lesson={lesson}
              lines={
                currentStep.examples.length > 0
                  ? currentStep.examples.map((row) => ({
                      speaker: row.label,
                      chinese: row.chinese ?? "",
                      pinyin: row.pinyin,
                      mongolian: row.mongolian,
                    }))
                  : content.dialogueLines
              }
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "common-mistake" ? (
            <CommonMistakesCard
              step={currentStep}
              media={content.study.media}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "phrase-breakdown" ? (
            <PhraseBreakdownCard
              step={currentStep}
              media={content.study.media}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "tone-sandhi" ? (
            <ToneSandhiCard
              step={currentStep}
              media={content.study.media}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "characters" ? (
            <CharactersLessonCard
              step={currentStep}
              media={content.study.media}
              teachingImages={lesson.teachingImages}
              lessonId={routeLessonId}
            />
          ) : null}

          {currentStep?.type === "content" ? (
            <GuidedStepCard
              step={currentStep}
              media={content.study.media}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          {currentStep?.type === "practice-menu" ? (
            <PracticeMenuCard
              vocabHref={vocabHref}
              quizHref={quizHref}
              lessonId={routeLessonId}
              workbookHref={
                (lesson.hskStudy?.workbook?.length ?? 0) > 0
                  ? workbookHref
                  : undefined
              }
            />
          ) : null}

          {currentStep?.type === "complete" ? (
            <LessonCompleteCard
              message={currentStep.teacherSpeechMn || content.completeMessage}
              vocabHref={vocabHref}
              quizHref={quizHref}
              nextHref={nextHref}
              detailHref={detailHref}
              onRestart={handleRestart}
              media={content.study.media}
              stepMedia={stepMediaRef(currentStep)}
              teachingImages={lesson.teachingImages}
            />
          ) : null}

          <HskOptionalVideoInline lesson={lesson} adminPreview={adminPreview} />
        </div>

        {!isLastStep ? (
          <div
            className="sticky bottom-0 mt-3 shrink-0 border-t border-slate-100 pt-3"
            style={{ backgroundColor: HSK_PLAYER.background }}
          >
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={goPrevious}
                disabled={stepIndex === 0}
                className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                ← Өмнөх
              </button>
              <button
                type="button"
                onClick={goNext}
                className="min-h-[44px] flex-1 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                {isLastStep ? "Дуусгах" : "Дараагийнх →"}
              </button>
            </div>
            <button
              type="button"
              onClick={goNext}
              className={lessonPlayerPrimaryBtnClass(false)}
              style={{ backgroundColor: HSK_PLAYER.primary }}
            >
              Үргэлжлүүлэх
            </button>
          </div>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
