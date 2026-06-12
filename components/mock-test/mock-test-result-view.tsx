"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MockTestQuestion } from "@/components/mock-test/mock-test-question";
import { formatMockTestAnswer } from "@/lib/mock-test/format-answer";
import { lessonPath } from "@/lib/content";
import type { HskScoreBreakdown } from "@/lib/mock-test/hsk-scoring";
import {
  SKILL_LABELS_MN,
  type MockTestQuestionRow,
  type MockTestRow,
  type MockTestScoreResult,
} from "@/lib/mock-test/types";
import type { WeakLessonRecommendation } from "@/lib/mock-test/weak-lessons";

type Props = {
  test: MockTestRow;
  result: MockTestScoreResult;
  hsk: HskScoreBreakdown;
  questions: MockTestQuestionRow[];
  weakLessons: WeakLessonRecommendation[];
  completedLessonIds?: Iterable<string>;
  saveNote?: string | null;
  backHref?: string;
  backLabel?: string;
};

export function MockTestResultView({
  test,
  result,
  hsk,
  questions,
  weakLessons,
  completedLessonIds,
  saveNote,
  backHref = "/review",
  backLabel = "Буцах",
}: Props) {
  const completedSet = new Set(completedLessonIds ?? []);
  const [showWrongReview, setShowWrongReview] = useState(false);

  const questionById = useMemo(() => {
    const map = new Map<string, MockTestQuestionRow>();
    for (const question of questions) {
      map.set(question.id, question);
    }
    return map;
  }, [questions]);

  const wrongDetails = useMemo(
    () => result.details.filter((detail) => detail.isCorrect === false),
    [result.details]
  );

  return (
    <div className="bs-mt-result px-4">
      <h1 className="bs-mt-title">Дууслаа</h1>
      <p className="bs-mock-result-badge mt-2">{test.title}</p>

      <div className="bs-mt-hsk-score-ring mt-4">
        <p className="bs-mt-score-big">
          {hsk.totalScore}
          <span className="bs-mt-score-max"> / {hsk.maxTotal}</span>
        </p>
      </div>

      {hsk.passed ? (
        <p className="bs-mt-pass-badge bs-mt-pass-badge--ok">Тэнцлээ ✓</p>
      ) : (
        <p className="bs-mt-pass-badge bs-mt-pass-badge--no">
          {hsk.passThreshold}-д {Math.max(0, hsk.passThreshold - hsk.totalScore)}{" "}
          оноо дутлаа
        </p>
      )}

      {hsk.writingPending ? (
        <p className="bs-mt-save-note">Бичих хэсэг: үнэлээгүй</p>
      ) : null}
      {saveNote ? <p className="bs-mt-save-note">{saveNote}</p> : null}

      <div className="bs-mt-card mt-4">
        <p className="bs-mt-section-title">Хэсгийн оноо (100-балл)</p>
        {Object.keys(hsk.sectionMax).map((skill) => {
          const score = hsk.sectionScores[skill];
          const label = SKILL_LABELS_MN[skill] ?? skill;
          if (score == null) {
            return (
              <p key={skill} className="bs-mt-card-meta">
                {label}: үнэлээгүй
              </p>
            );
          }
          return (
            <div key={skill} className="bs-mt-skill-bar-row">
              <span className="bs-mt-skill-bar-label">{label}</span>
              <div className="bs-mt-skill-bar-track">
                <div
                  className="bs-mt-skill-bar-fill"
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
              <span className="bs-mt-skill-bar-val">{score}</span>
            </div>
          );
        })}
      </div>

      {wrongDetails.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            className="bs-mt-wrong-toggle"
            onClick={() => setShowWrongReview((value) => !value)}
            aria-expanded={showWrongReview}
          >
            {showWrongReview ? "Буруу хариултыг нуух" : "Буруу хариултаа харах"}
            <span className="bs-mt-wrong-count">{wrongDetails.length}</span>
          </button>

          {showWrongReview ? (
            <div className="bs-mt-wrong-review mt-3">
              {wrongDetails.map((detail) => {
                const question = questionById.get(detail.questionId);
                if (!question) return null;
                return (
                  <div key={detail.qNo} className="bs-mt-wrong-item">
                    <p className="bs-mt-wrong-meta">
                      №{detail.qNo} · {SKILL_LABELS_MN[detail.skill] ?? detail.skill}
                    </p>
                    <p className="bs-mt-wrong-user">
                      Таны хариулт:{" "}
                      <span className="hanzi">
                        {formatMockTestAnswer(question, detail.userAnswer)}
                      </span>
                    </p>
                    <MockTestQuestion
                      question={question}
                      answers={{
                        [String(detail.qNo)]: detail.userAnswer ?? "",
                      }}
                      onAnswer={() => {}}
                      showResults
                      resultCorrect={false}
                      hideQuestionAudio
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {weakLessons.length > 0 ? (
        <section className="bs-mt-weak-section mt-4">
          <p className="bs-mt-section-title">Сул талаа нөхөх хичээлүүд</p>
          <div className="bs-mt-weak-list">
            {weakLessons.map((lesson) => (
              <Link
                key={lesson.lessonId}
                href={lessonPath(lesson.lessonId)}
                className="bs-mt-weak-card"
              >
                <p className="bs-mt-weak-title">
                  {lesson.title}
                  {completedSet.has(lesson.lessonId) ? (
                    <span className="bs-mt-weak-done" aria-label="Дууссан">
                      {" "}
                      ✓
                    </span>
                  ) : null}
                </p>
                <span className="bs-mt-weak-badge">
                  {lesson.wrongCount} асуулт буруу
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href={backHref}
        className="bs-mock-primary-btn mt-6 block text-center leading-[48px] no-underline"
      >
        {backLabel}
      </Link>
    </div>
  );
}
