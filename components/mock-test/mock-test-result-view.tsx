"use client";

import Link from "next/link";
import { lessonPath } from "@/lib/content";
import {
  SKILL_LABELS_MN,
  type MockTestRow,
  type MockTestScoreResult,
} from "@/lib/mock-test/types";
import type { WeakLessonRecommendation } from "@/lib/mock-test/weak-lessons";

type Props = {
  test: MockTestRow;
  result: MockTestScoreResult;
  weakLessons: WeakLessonRecommendation[];
  saveNote?: string | null;
  backHref?: string;
  backLabel?: string;
};

export function MockTestResultView({
  test,
  result,
  weakLessons,
  saveNote,
  backHref = "/review",
  backLabel = "Буцах",
}: Props) {
  const pct =
    result.maxScore > 0
      ? Math.round((result.rawScore / result.maxScore) * 100)
      : 0;

  return (
    <div className="bs-mt-result px-4">
      <h1 className="bs-mt-title">Дууслаа</h1>
      <p className="bs-mock-result-badge mt-2">{test.title}</p>
      <p className="bs-mt-score-big">
        {result.rawScore} / {result.maxScore}
      </p>
      <p className="bs-mock-score-pct">{pct}%</p>
      {saveNote ? <p className="bs-mt-save-note">{saveNote}</p> : null}

      <div className="bs-mt-card mt-4">
        <p className="bs-mt-section-title">Чадварын оноо</p>
        {Object.keys(result.maxBySkill).map((sk) => {
          const got = result.scoreBySkill[sk] ?? 0;
          const max = result.maxBySkill[sk] ?? 0;
          const skPct = max > 0 ? Math.round((got / max) * 100) : 0;
          return (
            <p key={sk} className="bs-mt-card-meta">
              {SKILL_LABELS_MN[sk] ?? sk}: {got}/{max} ({skPct}%)
            </p>
          );
        })}
        {result.manualCount > 0 ? (
          <p className="bs-mt-card-meta mt-2">
            {result.manualCount} асуулт гараар/AI-аар үнэлэгдэнэ
          </p>
        ) : null}
      </div>

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
                <p className="bs-mt-weak-title">{lesson.title}</p>
                <span className="bs-mt-weak-badge">
                  {lesson.wrongCount} асуулт буруу
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="bs-mt-questions mt-4">
        {result.details.map((d) => (
          <div key={d.qNo} className="bs-mt-review-card">
            <p className="bs-mt-q-label">
              №{d.qNo} · {SKILL_LABELS_MN[d.skill] ?? d.skill}
              {d.isCorrect === true ? (
                <span className=" bs-mt-q-ok"> ✓</span>
              ) : d.isCorrect === false ? (
                <span className=" bs-mt-q-bad"> ✗</span>
              ) : (
                <span className=" bs-mt-q-pending"> …</span>
              )}
            </p>
            {d.explanationMn ? (
              <p className="bs-mt-explain">{d.explanationMn}</p>
            ) : null}
          </div>
        ))}
      </div>

      <Link
        href={backHref}
        className="bs-mock-primary-btn mt-6 block text-center leading-[48px] no-underline"
      >
        {backLabel}
      </Link>
    </div>
  );
}
