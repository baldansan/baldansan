"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LessonDifficultyFeedback } from "@/components/feedback/lesson-difficulty-feedback";
import { getBsQuizProgress } from "@/lib/lesson/bs-step-progress";
import { extractLessonPathSummaryData } from "@/lib/lesson/lesson-path-summary-data";
import {
  loadLessonPathReflection,
  saveLessonPathReflection,
} from "@/lib/lesson/lesson-path-reflection";
import { coursePath } from "@/lib/content";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { saveLessonWordsBatch } from "@/lib/supabase/saved-words";
import type { HskLessonPackage } from "@/types/hsk-lesson-package";

type Props = {
  lessonId: string;
  lesson: HskLessonPackage;
  courseId: string;
  nextLessonId?: string | null;
  adminPreview?: boolean;
  quizTotal?: number;
};

export function LessonPathSummaryStage({
  lessonId,
  lesson,
  courseId,
  nextLessonId = null,
  adminPreview = false,
  quizTotal = 0,
}: Props) {
  const summary = useMemo(() => extractLessonPathSummaryData(lesson), [lesson]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [savingWords, setSavingWords] = useState(false);
  const [quizScore, setQuizScore] = useState<{
    correct: number;
    total: number;
    percent: number;
  } | null>(null);

  useEffect(() => {
    setAnswers(loadLessonPathReflection(lessonId, summary.reflectionQuestions.length));
    const savedQuiz = getBsQuizProgress(lessonId);
    if (savedQuiz?.finished && savedQuiz.correctCount >= 0) {
      const correct = savedQuiz.correctCount;
      const resolvedTotal = quizTotal > 0 ? quizTotal : savedQuiz.currentIndex + 1;
      setQuizScore({
        correct,
        total: resolvedTotal,
        percent:
          resolvedTotal > 0
            ? Math.round((correct / resolvedTotal) * 100)
            : 0,
      });
    }
  }, [lessonId, summary.reflectionQuestions.length, quizTotal]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  function handleAnswerChange(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      saveLessonPathReflection(lessonId, next);
      return next;
    });
  }

  async function handleSaveAllWords() {
    if (summary.vocabulary.length === 0) return;
    setSavingWords(true);
    try {
      const result = await saveLessonWordsBatch(
        summary.vocabulary.map((item) => ({
          zh: item.zh,
          pinyin: item.pinyin,
          mn: item.mn,
        }))
      );
      if (!result.ok && result.error) {
        showToast(result.error);
        return;
      }
      showToast(
        `${result.added} үг нэмэгдлээ, ${result.alreadyHad} аль хэдийн байсан`
      );
    } finally {
      setSavingWords(false);
    }
  }

  const nextHref = nextLessonId
    ? lessonPreviewPath(nextLessonId, { adminPreview, subpath: "watch" })
    : coursePath(courseId);

  const nextLabel = nextLessonId
    ? "Дараагийн хичээл рүү →"
    : "Курс руу буцах →";

  return (
    <div className="bs-path-summary">
      {toast ? (
        <p className="bs-path-summary-toast" role="status">
          {toast}
        </p>
      ) : null}

      <div className="bs-card">
        <div className="bs-label">
          <span className="bs-dot" />
          Өнөөдрийн олз
        </div>
        <p className="bs-path-summary-lead">
          <span className="bs-path-summary-n">{summary.vocabCount}</span> шинэ үг
        </p>
        {summary.vocabCount > 0 ? (
          <button
            type="button"
            className="bs-cta bs-path-summary-save-all"
            onClick={() => void handleSaveAllWords()}
            disabled={savingWords}
          >
            {savingWords ? "Нэмж байна..." : "Бүгдийг давталтад нэмэх"}
          </button>
        ) : (
          <p className="text-sm text-[var(--bs-muted)]">Шинэ үг байхгүй.</p>
        )}
      </div>

      {summary.structureChips.length > 0 ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Сурсан бүтэц
          </div>
          <div className="bs-chips">
            {summary.structureChips.map((chip) => (
              <span key={chip} className="bs-chip">
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {quizScore ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Сорилын үр дүн
          </div>
          <p className="bs-path-quiz-score">
            {quizScore.correct}/{quizScore.total} зөв · {quizScore.percent}%
          </p>
        </div>
      ) : null}

      {summary.reflectionQuestions.length > 0 ? (
        <div className="bs-card">
          <div className="bs-label">
            <span className="bs-dot" />
            Эргэцүүлье
          </div>
          <div className="bs-path-reflection-list">
            {summary.reflectionQuestions.map((question, index) => (
              <label key={`${index}-${question}`} className="bs-path-reflection-item">
                <span className="bs-path-reflection-q">{question}</span>
                <textarea
                  className="bs-path-reflection-input"
                  rows={3}
                  placeholder="Хариултаа бичээрэй (заавал биш)"
                  value={answers[index] ?? ""}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <LessonDifficultyFeedback lessonId={lessonId} />

      <Link href={nextHref} className="bs-cta bs-path-summary-next">
        {nextLabel}
      </Link>
    </div>
  );
}
