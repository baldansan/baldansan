"use client";

import { useMemo, useState } from "react";
import "@/components/lesson/modules/exercises-module.css";
import { countMockExamAnswered } from "@/lib/mock-test/exam-progress";
import { SKILL_LABELS_MN, type MockTestAnswers, type MockTestExamMode, type MockTestQuestionRow, type MockTestRow } from "@/lib/mock-test/types";

type Props = {
  test: MockTestRow;
  questions: MockTestQuestionRow[];
  skills: string[];
  examMode: MockTestExamMode;
  previewAnswers: MockTestAnswers;
  canContinue: boolean;
  onFreshStart: () => void;
  onContinue: () => void;
  onJumpToQuestion: (skill: string, qNo: number) => void;
};

export function MockTestExamOverview({
  test,
  questions,
  skills,
  examMode,
  previewAnswers,
  canContinue,
  onFreshStart,
  onContinue,
  onJumpToQuestion,
}: Props) {
  const [activeSkill, setActiveSkill] = useState(skills[0] ?? "listening");

  const answeredCount = useMemo(
    () => countMockExamAnswered(previewAnswers),
    [previewAnswers]
  );

  const sectionStats = useMemo(
    () =>
      skills.map((skill) => {
        const sectionQuestions = questions.filter((q) => q.skill === skill);
        const answered = sectionQuestions.filter((q) =>
          Boolean((previewAnswers[String(q.q_no)] ?? "").trim())
        ).length;
        return {
          skill,
          label: SKILL_LABELS_MN[skill] ?? skill,
          total: sectionQuestions.length,
          answered,
          firstQNo: sectionQuestions[0]?.q_no ?? 1,
        };
      }),
    [skills, questions, previewAnswers]
  );

  const visibleQuestions = useMemo(
    () => questions.filter((q) => q.skill === activeSkill),
    [questions, activeSkill]
  );

  return (
    <div className="bs-mt-overview px-4">
      <h2 className="bs-mt-overview-title">Сорилын тойм</h2>
      <p className="bs-mt-overview-sub">
        {examMode === "real" ? "Жинхэнэ горим" : "Дадлагын горим"} · {test.title}
      </p>
      <p className="bs-ex-overview-hint">
        Ногоон — хариулсан, саарал — хийгээгүй. Хэсэг эсвэл асуулт дээр дарж тэндээс эхлэх боломжтой.
      </p>

      <div className="bs-card bs-ex mt-4">
        <div className="bs-vtop">
          <div className="bs-label" style={{ margin: 0 }}>
            <span className="bs-dot" />
            Явц
          </div>
          <span className="bs-counter">
            {answeredCount} / {questions.length} хариулсан
          </span>
        </div>

        <div className="bs-mt-overview-sections">
          {sectionStats.map((section) => (
            <button
              key={section.skill}
              type="button"
              className={`bs-mt-overview-section ${activeSkill === section.skill ? "bs-mt-overview-section--active" : ""}`}
              onClick={() => {
                setActiveSkill(section.skill);
                onJumpToQuestion(section.skill, section.firstQNo);
              }}
            >
              <span className="bs-mt-overview-section-label">{section.label}</span>
              <span className="bs-mt-overview-section-meta">
                {section.answered}/{section.total}
              </span>
            </button>
          ))}
        </div>

        <div className="bs-mt-section-nav bs-mt-overview-skill-tabs">
          {skills.map((skill) => (
            <button
              key={skill}
              type="button"
              className={`bs-mt-section-btn ${activeSkill === skill ? "bs-mt-section-btn--active" : ""}`}
              onClick={() => setActiveSkill(skill)}
            >
              {SKILL_LABELS_MN[skill] ?? skill}
            </button>
          ))}
        </div>

        <nav className="bs-ex-nav bs-ex-overview-nav" aria-label="Асуултын тойм">
          {visibleQuestions.map((question) => {
            const answered = Boolean(
              (previewAnswers[String(question.q_no)] ?? "").trim()
            );
            const cls = [
              "bs-ex-nav-btn",
              answered ? "bs-started" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={question.id}
                type="button"
                className={cls}
                aria-label={`Асуулт ${question.q_no}`}
                onClick={() => onJumpToQuestion(question.skill, question.q_no)}
              >
                {question.q_no}
              </button>
            );
          })}
        </nav>
      </div>

      <button type="button" className="bs-mock-primary-btn mt-4 w-full" onClick={onFreshStart}>
        Эхнээс эхлэх
      </button>
      <button
        type="button"
        className="bs-mt-overview-secondary mt-2 w-full"
        onClick={onContinue}
        disabled={!canContinue}
      >
        Үргэлжлүүлэх
      </button>
    </div>
  );
}
