"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LessonQuizSentenceOrder } from "@/components/lesson/lesson-quiz-sentence-order";
import { LessonStepQuiz } from "@/components/lesson-player/lesson-step-quiz";
import "@/components/lesson/modules/exercises-module.css";
import {
  clearBsQuizProgress,
  countQuizAnswered,
  getBsQuizProgress,
  hasBsQuizSavedProgress,
  saveBsQuizProgress,
  type BsQuizStepProgress,
} from "@/lib/lesson/bs-step-progress";
import { prepareLessonQuizQuestions } from "@/lib/quiz/smart-options";
import {
  gradeQuizSentenceOrder,
  isQuizSentenceOrderQuestion,
} from "@/lib/quiz/sentence-order";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapQuizQuestionType,
  mapQuizStage,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import { QuestionFeedbackButtons } from "@/components/feedback/question-feedback-buttons";
import { resolveKoreanTtsLang } from "@/lib/lesson/teaching-media";
import type { LessonContent } from "@/types/lesson-content";
import type { QuizQuestion } from "@/types/lesson";

type Props = {
  lessonId: string;
  lesson: LessonContent;
  quizQuestions: QuizQuestion[];
  useDatabaseQuizOptions?: boolean;
  onFinished: () => void;
};

type Phase = "overview" | "active";

function resultsFromSaved(
  raw: Record<string, "ok" | "no"> | undefined
): Record<string, "ok" | "no"> {
  if (!raw) return {};
  return { ...raw };
}

export function LessonPathQuizStage({
  lessonId,
  lesson,
  quizQuestions: quizQuestionsProp,
  useDatabaseQuizOptions = false,
  onFinished,
}: Props) {
  const quizQuestions = useMemo(
    () =>
      prepareLessonQuizQuestions(quizQuestionsProp, lesson.vocabulary, {
        rewriteOptions: !useDatabaseQuizOptions,
      }),
    [quizQuestionsProp, lesson.vocabulary, useDatabaseQuizOptions]
  );

  const total = quizQuestions.length;
  const ttsLang = resolveKoreanTtsLang(lesson);

  const [phase, setPhase] = useState<Phase>("overview");
  const savedProgressRef = useRef<BsQuizStepProgress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [resultsByIndex, setResultsByIndex] = useState<
    Record<string, "ok" | "no">
  >({});

  const overviewAnswered = useMemo(
    () => Object.keys(resultsByIndex).length,
    [resultsByIndex]
  );
  const canContinueFromOverview = hasBsQuizSavedProgress(lessonId);
  const overviewSaved = savedProgressRef.current;

  useEffect(() => {
    savedProgressRef.current = getBsQuizProgress(lessonId);
    if (savedProgressRef.current?.resultsByIndex) {
      setResultsByIndex(resultsFromSaved(savedProgressRef.current.resultsByIndex));
    }
    setHydrated(true);
  }, [lessonId]);

  const persist = useCallback(
    (
      patch: {
        currentIndex: number;
        correctCount: number;
        finished: boolean;
      },
      results?: Record<string, "ok" | "no">
    ) => {
      const nextResults = results ?? resultsByIndex;
      saveBsQuizProgress(lessonId, {
        currentIndex: patch.currentIndex,
        correctCount: patch.correctCount,
        answeredCount: Object.keys(nextResults).length,
        finished: patch.finished,
        completed: patch.finished,
        resultsByIndex: nextResults,
      });
      savedProgressRef.current = getBsQuizProgress(lessonId);
    },
    [lessonId, resultsByIndex]
  );

  function applySavedProgress(saved: BsQuizStepProgress) {
    const nextIndex = Math.min(Math.max(0, saved.currentIndex), total - 1);
    setCurrentIndex(nextIndex);
    setCorrectCount(saved.correctCount);
    setFinished(saved.finished);
    setResultsByIndex(resultsFromSaved(saved.resultsByIndex));
    setSelected(null);
    setRevealed(false);
  }

  function startFresh() {
    clearBsQuizProgress(lessonId);
    savedProgressRef.current = null;
    setCurrentIndex(0);
    setSelected(null);
    setRevealed(false);
    setCorrectCount(0);
    setFinished(false);
    setResultsByIndex({});
    setPhase("active");
  }

  function continueFromSaved() {
    const saved = savedProgressRef.current;
    if (!saved) return;
    applySavedProgress(saved);
    setPhase("active");
  }

  function jumpToQuestion(index: number) {
    if (index < 0 || index >= total) return;
    const saved = savedProgressRef.current;
    if (saved) {
      applySavedProgress({ ...saved, currentIndex: index, finished: false });
    } else {
      setCurrentIndex(index);
      setSelected(null);
      setRevealed(false);
      setFinished(false);
    }
    setPhase("active");
  }

  const current = quizQuestions[currentIndex];
  const getElapsed = useQuestionTimer(`${lessonId}:quiz:${currentIndex}`);
  const currentIsSentenceOrder = current
    ? isQuizSentenceOrderQuestion(current)
    : false;

  function isAnswerCorrect(question: QuizQuestion, answer: string | null): boolean {
    if (!answer) return false;
    if (isQuizSentenceOrderQuestion(question)) {
      return gradeQuizSentenceOrder(question, answer);
    }
    return answer === question.correctAnswer;
  }

  function logQuizAttempt(answer: string, ok: boolean) {
    if (!current) return;
    const sentenceOrder = isQuizSentenceOrderQuestion(current);
    recordQuestionAttempt({
      lessonId,
      stage: mapQuizStage(sentenceOrder),
      questionId:
        current.dbId != null
          ? `quiz:db:${current.dbId}`
          : `quiz:${current.orderIndex ?? currentIndex}`,
      questionType: mapQuizQuestionType(current.type, sentenceOrder),
      isCorrect: ok,
      selectedAnswer: answer,
      correctAnswer: current.correctAnswer,
      timeSpentMs: getElapsed(),
    });
  }

  function handleSelect(option: string) {
    if (revealed || finished) return;
    setSelected(option);
    setRevealed(true);
    logQuizAttempt(option, isAnswerCorrect(current, option));
  }

  function handleSentenceOrderCheck(answer: string) {
    if (revealed || finished || !current) return;
    const ok = isAnswerCorrect(current, answer);
    setSelected(answer);
    setRevealed(true);
    logQuizAttempt(answer, ok);
  }

  function handleNextQuestion() {
    if (!revealed || !current) return;
    const gained = isAnswerCorrect(current, selected) ? 1 : 0;
    const nextCorrect = correctCount + gained;
    const resultKey = String(currentIndex);
    const nextResults: Record<string, "ok" | "no"> = {
      ...resultsByIndex,
      [resultKey]: isAnswerCorrect(current, selected) ? "ok" : "no",
    };
    setResultsByIndex(nextResults);

    const isLast = currentIndex >= total - 1;

    if (isLast) {
      setCorrectCount(nextCorrect);
      setFinished(true);
      persist(
        {
          currentIndex,
          correctCount: nextCorrect,
          finished: true,
        },
        nextResults
      );
      onFinished();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCorrectCount(nextCorrect);
    setCurrentIndex(nextIndex);
    setSelected(null);
    setRevealed(false);
    persist(
      {
        currentIndex: nextIndex,
        correctCount: nextCorrect,
        finished: false,
      },
      nextResults
    );
  }

  if (!hydrated) {
    return (
      <p className="py-8 text-center text-sm text-[var(--bs-muted)]">
        Сорил ачаалж байна...
      </p>
    );
  }

  if (total === 0) {
    return (
      <div className="bs-card">
        <p className="text-sm text-[var(--bs-muted)]">
          Энэ хичээлд сорил байхгүй байна.
        </p>
      </div>
    );
  }

  if (phase === "overview") {
    const savedAnswered = overviewSaved
      ? countQuizAnswered(overviewSaved)
      : overviewAnswered;

    return (
      <>
        <div className="bs-card bs-ex">
          <div className="bs-vtop">
            <div className="bs-label" style={{ margin: 0 }}>
              <span className="bs-dot" />
              Сорил
            </div>
            <span className="bs-counter">
              {savedAnswered} / {total} хариулсан
            </span>
          </div>
          <p className="bs-ex-overview-hint">
            Сорилын тойм — ногоон зөв, улаан буруу, саарал хийгээгүй. Асуулт дээр дарж тэндээс эхлэх боломжтой.
          </p>
          <nav className="bs-ex-nav bs-ex-overview-nav" aria-label="Сорилын тойм">
            {quizQuestions.map((_, index) => {
              const result = resultsByIndex[String(index)];
              const cls = [
                "bs-ex-nav-btn",
                result === "ok" ? "bs-done-ok" : "",
                result === "no" ? "bs-done-no" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={index}
                  type="button"
                  className={cls}
                  aria-label={`Асуулт ${index + 1}`}
                  onClick={() => jumpToQuestion(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </nav>
          {overviewSaved?.finished ? (
            <p className="bs-ex-overview-status">
              Өмнө дууссан: {overviewSaved.correctCount}/{total} зөв
            </p>
          ) : savedAnswered > 0 ? (
            <p className="bs-ex-overview-status">
              {savedAnswered} / {total} асуулт хариулсан
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="bs-cta bs-path-visible-cta"
          onClick={startFresh}
        >
          Эхнээс эхлэх
        </button>
        <button
          type="button"
          className="bs-cta bs-cta-secondary bs-path-visible-cta"
          onClick={continueFromSaved}
          disabled={!canContinueFromOverview}
        >
          Үргэлжлүүлэх
        </button>
      </>
    );
  }

  if (finished) {
    const percent = Math.round((correctCount / total) * 100);
    return (
      <div className="bs-card bs-path-quiz-done">
        <p className="bs-path-quiz-score">
          {correctCount}/{total} зөв · {percent}%
        </p>
        <p className="text-sm text-[var(--bs-ink-2)]">
          Сорил дууслаа. Дараагийн үе рүү шилжинэ.
        </p>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="bs-path-quiz">
      {currentIsSentenceOrder ? (
        <LessonQuizSentenceOrder
          question={current}
          index={currentIndex}
          total={total}
          selected={selected}
          revealed={revealed}
          ttsLang={ttsLang}
          courseId={lesson.courseId}
          onChecked={handleSentenceOrderCheck}
        />
      ) : (
        <LessonStepQuiz
          question={current}
          index={currentIndex}
          total={total}
          selected={selected}
          revealed={revealed}
          ttsLang={ttsLang}
          courseId={lesson.courseId}
          onSelect={handleSelect}
        />
      )}
      {revealed ? (
        <>
          <QuestionFeedbackButtons
            lessonId={lessonId}
            questionId={
              current.dbId != null
                ? `quiz:db:${current.dbId}`
                : `quiz:${current.orderIndex ?? currentIndex}`
            }
          />
          <button
            type="button"
            className="bs-cta bs-path-footer-cta"
            onClick={handleNextQuestion}
            style={{ marginTop: 8 }}
          >
            {currentIndex >= total - 1 ? "Сорил дуусгах" : "Дараагийн асуулт →"}
          </button>
        </>
      ) : null}
    </div>
  );
}
