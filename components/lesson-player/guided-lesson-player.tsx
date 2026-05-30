"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPreviewBanner } from "@/components/admin-preview-banner";
import {
  LessonPlayerShell,
  lessonPlayerPrimaryBtnClass,
} from "@/components/lesson-player/lesson-player-shell";
import { LessonStepSummary } from "@/components/lesson-player/lesson-step-summary";
import { LessonStepTeacherNote } from "@/components/lesson-player/lesson-step-teacher-note";
import { LessonStepConcept } from "@/components/lesson-player/lesson-step-concept";
import { LessonStepVisual } from "@/components/lesson-player/lesson-step-visual";
import { LessonStepFlashcard } from "@/components/lesson-player/lesson-step-flashcard";
import { LessonStepPractice } from "@/components/lesson-player/lesson-step-practice";
import {
  LessonStepQuiz,
  LessonStepQuizIntro,
} from "@/components/lesson-player/lesson-step-quiz";
import {
  LessonStepNextLesson,
  LessonStepResult,
} from "@/components/lesson-player/lesson-step-result";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import {
  buildLessonSteps,
  countProgressSteps,
} from "@/lib/lesson-player/build-lesson-steps";
import {
  clearLessonPlayerProgress,
  defaultPlayerSession,
  getLessonPlayerProgress,
  saveLessonPlayerProgress,
} from "@/lib/lesson-player/lesson-player-progress";
import { resolveKoreanTtsLang } from "@/lib/lesson/teaching-media";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { isKoreanFlashcardVocabularyLesson } from "@/lib/lesson/korean-vocabulary-ui";
import {
  getLearnedWordsSmart,
  markLessonCompletedSmart,
  markLessonStartedSmart,
  PASSING_QUIZ_PERCENT,
  saveQuizResultSmart,
  toggleLearnedWordSmart,
  vocabularyWordKey,
} from "@/lib/progress";
import { buildQuizDetailedAnswer } from "@/lib/quiz-answers";
import type { LessonContent } from "@/types/lesson-content";
import type { LessonPlayerSession, LessonStep } from "@/types/lesson-player";
import type { VocabularyWord } from "@/types/lesson";

type Props = {
  lesson: LessonContent;
  nextLessonId: string | null;
  adminPreview?: boolean;
  routeLessonId: string;
};

export function GuidedLessonPlayer({
  lesson,
  nextLessonId,
  adminPreview = false,
  routeLessonId,
}: Props) {
  const router = useRouter();
  const progressKey = routeLessonId;

  const steps = useMemo(
    () =>
      buildLessonSteps(
        lesson,
        lesson.vocabulary,
        lesson.quizQuestions,
        lesson.subtitlePreview,
        { nextLessonId }
      ),
    [lesson, nextLessonId]
  );

  const progressTotal = useMemo(() => countProgressSteps(steps), [steps]);
  const ttsLang = resolveKoreanTtsLang(lesson);
  const isKorean = isKoreanFlashcardVocabularyLesson(lesson, lesson.vocabulary);

  const [session, setSession] = useState<LessonPlayerSession>(
    defaultPlayerSession
  );
  const [hydrated, setHydrated] = useState(false);
  const [learned, setLearned] = useState<Set<string>>(new Set());

  const [practiceSelected, setPracticeSelected] = useState<string | null>(null);
  const [practiceRevealed, setPracticeRevealed] = useState(false);

  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  const currentStep: LessonStep | undefined = steps[session.stepIndex];

  const persistSession = useCallback(
    (next: LessonPlayerSession) => {
      setSession(next);
      saveLessonPlayerProgress(progressKey, next);
    },
    [progressKey]
  );

  useEffect(() => {
    const saved = getLessonPlayerProgress(progressKey);
    if (saved && saved.stepIndex < steps.length) {
      setSession(saved);
    }
    setHydrated(true);
  }, [progressKey, steps.length]);

  useEffect(() => {
    if (!hydrated) return;
    void markLessonStartedSmart(lesson.id);
  }, [hydrated, lesson.id]);

  useEffect(() => {
    async function loadLearned() {
      const words = await getLearnedWordsSmart(lesson.id, lesson.vocabulary);
      setLearned(new Set(words));
    }
    void loadLearned();
  }, [lesson.id, lesson.vocabulary]);

  useEffect(() => {
    setPracticeSelected(null);
    setPracticeRevealed(false);
    setQuizSelected(null);
    setQuizRevealed(false);
  }, [session.stepIndex]);

  async function handleMarkLearned(word: VocabularyWord) {
    await toggleLearnedWordSmart(lesson.id, word);
    setLearned((prev) => {
      const next = new Set(prev);
      next.add(vocabularyWordKey(word));
      return next;
    });
  }

  function advanceStep() {
    const nextIndex = session.stepIndex + 1;
    if (nextIndex >= steps.length) return;
    persistSession({ ...session, stepIndex: nextIndex });
  }

  function handleRestart() {
    clearLessonPlayerProgress(progressKey);
    setSession(defaultPlayerSession());
    setPracticeSelected(null);
    setPracticeRevealed(false);
    setQuizSelected(null);
    setQuizRevealed(false);
  }

  function handleClose() {
    router.push(lessonPreviewPath(lesson.id, { adminPreview }));
  }

  async function completeLessonIfPassed() {
    const quizSteps = steps.filter((s) => s.type === "quiz_question");
    const quizTotal = quizSteps.length;
    const quizPercent =
      quizTotal > 0
        ? Math.round((session.quizCorrectCount / quizTotal) * 100)
        : 100;

    if (quizTotal > 0) {
      await saveQuizResultSmart(
        lesson.id,
        session.quizCorrectCount,
        quizTotal,
        quizPercent
      );
    }

    if (quizPercent >= PASSING_QUIZ_PERCENT) {
      await markLessonCompletedSmart(lesson.id);
    }
  }

  useEffect(() => {
    if (currentStep?.type !== "result") return;
    void completeLessonIfPassed();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when result step is reached
  }, [currentStep?.type, session.stepIndex]);

  function handlePrimaryAction() {
    if (!currentStep) return;

    switch (currentStep.type) {
      case "summary":
      case "teacher_note":
      case "concept":
      case "visual":
      case "pronunciation":
      case "quiz_intro":
        advanceStep();
        break;

      case "vocabulary_flashcard": {
        const total = currentStep.vocabulary.length;
        if (session.flashcardIndex < total - 1) {
          persistSession({
            ...session,
            flashcardIndex: session.flashcardIndex + 1,
          });
        } else {
          persistSession({ ...session, flashcardIndex: 0 });
          advanceStep();
        }
        break;
      }

      case "practice": {
        const total = currentStep.questions.length;
        const q = currentStep.questions[session.practiceIndex];
        if (!practiceRevealed) {
          if (!practiceSelected || !q) return;
          setPracticeRevealed(true);
          if (practiceSelected === q.correctAnswer) {
            persistSession({
              ...session,
              practiceCorrect: session.practiceCorrect + 1,
            });
          }
          return;
        }
        if (session.practiceIndex < total - 1) {
          persistSession({
            ...session,
            practiceIndex: session.practiceIndex + 1,
          });
          setPracticeSelected(null);
          setPracticeRevealed(false);
        } else {
          persistSession({ ...session, practiceIndex: 0, practiceCorrect: 0 });
          advanceStep();
        }
        break;
      }

      case "quiz_question": {
        if (!quizRevealed) return;
        const isLastQuiz =
          currentStep.index >= currentStep.total - 1;
        if (isLastQuiz) {
          advanceStep();
        } else {
          advanceStep();
        }
        break;
      }

      case "next_lesson":
        if (nextLessonId) {
          router.push(
            `/study/lesson-training/${nextLessonId}${
              adminPreview ? "?preview=admin" : ""
            }`
          );
        } else {
          router.push("/study");
        }
        break;

      default:
        break;
    }
  }

  function handleQuizSelect(option: string) {
    if (!currentStep || currentStep.type !== "quiz_question" || quizRevealed) {
      return;
    }
    setQuizSelected(option);
    setQuizRevealed(true);
    const isCorrect = option === currentStep.question.correctAnswer;
    const orderIndex =
      currentStep.question.orderIndex ?? currentStep.index;
    buildQuizDetailedAnswer(currentStep.question, orderIndex, option);
    persistSession({
      ...session,
      quizAnswered: session.quizAnswered + 1,
      quizCorrectCount: isCorrect
        ? session.quizCorrectCount + 1
        : session.quizCorrectCount,
    });
  }

  function primaryCtaLabel(): string {
    if (!currentStep) return "Дараагийнх";

    switch (currentStep.type) {
      case "summary":
      case "teacher_note":
      case "concept":
      case "visual":
        return "Ойлголоо";
      case "vocabulary_flashcard":
        return session.flashcardIndex < currentStep.vocabulary.length - 1
          ? "Дараагийнх"
          : "Үргэлжлүүлэх";
      case "practice":
        if (!practiceRevealed) return "Шалгах";
        return session.practiceIndex < currentStep.questions.length - 1
          ? "Дараагийнх"
          : "Үргэлжлүүлэх";
      case "quiz_intro":
        return "Quiz эхлэх";
      case "quiz_question":
        if (!quizRevealed) return "Хариултаа сонгоно уу";
        return currentStep.index < currentStep.total - 1
          ? "Дараагийнх"
          : "Үр дүн харах";
      case "next_lesson":
        return "Дараагийн хичээл рүү";
      default:
        return "Дараагийнх";
    }
  }

  function isPrimaryDisabled(): boolean {
    if (!currentStep) return true;
    if (currentStep.type === "practice" && !practiceRevealed && !practiceSelected) {
      return true;
    }
    if (currentStep.type === "quiz_question" && !quizRevealed) {
      return true;
    }
    if (currentStep.type === "result") return true;
    return false;
  }

  const quizStepCount = steps.filter((s) => s.type === "quiz_question").length;

  if (!hydrated) {
    return (
      <MobileAppShell activeTab="study" showBottomNav={false}>
        <p className="py-16 text-center text-sm text-[var(--app-muted)]">
          Ачааллаж байна…
        </p>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell
      activeTab="study"
      showBottomNav={false}
      mainClassName="max-w-[430px] mx-auto w-full"
    >
      {adminPreview ? <AdminPreviewBanner /> : null}

      {isKorean ? (
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-emerald-600">
          KR-Beginner · Үсэг сурах
        </p>
      ) : null}

      <LessonPlayerShell
        stepIndex={session.stepIndex}
        totalSteps={progressTotal}
        onClose={handleClose}
        onRestart={handleRestart}
        hideBottomCta={
          currentStep?.type === "result" || currentStep?.type === "next_lesson"
        }
        bottomCta={
          <button
            type="button"
            disabled={isPrimaryDisabled()}
            onClick={handlePrimaryAction}
            className={lessonPlayerPrimaryBtnClass(isPrimaryDisabled())}
          >
            {primaryCtaLabel()}
          </button>
        }
      >
        {currentStep?.type === "summary" ? (
          <LessonStepSummary
            title={currentStep.title}
            text={currentStep.text}
          />
        ) : null}

        {currentStep?.type === "teacher_note" ? (
          <LessonStepTeacherNote
            title={currentStep.title}
            body={currentStep.body}
          />
        ) : null}

        {currentStep?.type === "concept" ? (
          <LessonStepConcept
            title={currentStep.title}
            content={currentStep.content}
            items={currentStep.items}
          />
        ) : null}

        {currentStep?.type === "visual" ? (
          <LessonStepVisual title={currentStep.title} lines={currentStep.lines} />
        ) : null}

        {currentStep?.type === "vocabulary_flashcard" ? (
          <LessonStepFlashcard
            lesson={lesson}
            vocabulary={currentStep.vocabulary}
            cardIndex={session.flashcardIndex}
            learned={learned}
            onMarkLearned={handleMarkLearned}
          />
        ) : null}

        {currentStep?.type === "practice" ? (
          <LessonStepPractice
            title={currentStep.title}
            question={currentStep.questions[session.practiceIndex]!}
            questionIndex={session.practiceIndex}
            total={currentStep.questions.length}
            selected={practiceSelected}
            revealed={practiceRevealed}
            onSelect={setPracticeSelected}
          />
        ) : null}

        {currentStep?.type === "quiz_intro" ? (
          <LessonStepQuizIntro
            title={currentStep.title}
            text={currentStep.text}
          />
        ) : null}

        {currentStep?.type === "quiz_question" ? (
          <LessonStepQuiz
            question={currentStep.question}
            index={currentStep.index}
            total={currentStep.total}
            selected={quizSelected}
            revealed={quizRevealed}
            ttsLang={ttsLang}
            courseId={lesson.courseId}
            onSelect={handleQuizSelect}
          />
        ) : null}

        {currentStep?.type === "result" ? (
          <LessonStepResult
            lessonId={lesson.id}
            nextLessonId={nextLessonId}
            adminPreview={adminPreview}
            quizCorrect={session.quizCorrectCount}
            quizTotal={quizStepCount}
            stepsCompleted={session.stepIndex}
            totalSteps={progressTotal}
            onRestart={handleRestart}
          />
        ) : null}

        {currentStep?.type === "next_lesson" ? (
          <LessonStepNextLesson
            title={currentStep.title}
            subtitle={currentStep.subtitle}
            nextLessonId={currentStep.nextLessonId}
            adminPreview={adminPreview}
          />
        ) : null}
      </LessonPlayerShell>

      <Link
        href={lessonPreviewPath(lesson.id, { adminPreview })}
        className="mt-4 block text-center text-xs text-[var(--app-muted)] hover:text-emerald-600"
      >
        Хичээлийн дэлгэрэнгүй рүү
      </Link>
    </MobileAppShell>
  );
}
