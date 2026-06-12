"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonStepQuiz } from "@/components/lesson-player/lesson-step-quiz";
import {
  getBsQuizProgress,
  saveBsQuizProgress,
} from "@/lib/lesson/bs-step-progress";
import { prepareLessonQuizQuestions } from "@/lib/quiz/smart-options";
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = getBsQuizProgress(lessonId);
    if (saved?.finished && total > 0) {
      setCurrentIndex(Math.min(saved.currentIndex, total - 1));
      setCorrectCount(saved.correctCount);
      setFinished(true);
    } else if (saved && total > 0) {
      setCurrentIndex(Math.min(saved.currentIndex, total - 1));
      setCorrectCount(saved.correctCount);
    }
    setHydrated(true);
  }, [lessonId, total]);

  const persist = useCallback(
    (patch: {
      currentIndex: number;
      correctCount: number;
      finished: boolean;
    }) => {
      saveBsQuizProgress(lessonId, {
        currentIndex: patch.currentIndex,
        correctCount: patch.correctCount,
        answeredCount: patch.currentIndex + (patch.finished ? 1 : 0),
        finished: patch.finished,
        completed: patch.finished,
      });
    },
    [lessonId]
  );

  const current = quizQuestions[currentIndex];

  function handleSelect(option: string) {
    if (revealed || finished) return;
    setSelected(option);
    setRevealed(true);
  }

  function handleNextQuestion() {
    if (!revealed || !current) return;
    const gained = selected === current.correctAnswer ? 1 : 0;
    const nextCorrect = correctCount + gained;
    const isLast = currentIndex >= total - 1;

    if (isLast) {
      setCorrectCount(nextCorrect);
      setFinished(true);
      persist({
        currentIndex,
        correctCount: nextCorrect,
        finished: true,
      });
      onFinished();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCorrectCount(nextCorrect);
    setCurrentIndex(nextIndex);
    setSelected(null);
    setRevealed(false);
    persist({
      currentIndex: nextIndex,
      correctCount: nextCorrect,
      finished: false,
    });
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
      {revealed ? (
        <button
          type="button"
          className="bs-cta bs-path-footer-cta"
          onClick={handleNextQuestion}
          style={{ marginTop: 8 }}
        >
          {currentIndex >= total - 1 ? "Сорил дуусгах" : "Дараагийн асуулт →"}
        </button>
      ) : null}
    </div>
  );
}
