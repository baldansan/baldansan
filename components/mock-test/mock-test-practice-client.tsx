"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { MockTestPracticeQuestion } from "@/components/mock-test/mock-test-practice-question";
import { useActivityTracker } from "@/lib/analytics/activity-tracker";
import { useQuestionTimer } from "@/lib/analytics/attempt-metrics";
import {
  mapMockQuestionType,
  recordQuestionAttempt,
} from "@/lib/analytics/record-question-attempt";
import {
  buildPracticeFeedback,
  isSelfGradedPracticeQuestion,
  type PracticeFeedback,
} from "@/lib/mock-test/practice-feedback";
import { SKILL_LABELS_MN, type MockTestQuestionRow, type MockTestRow } from "@/lib/mock-test/types";
import type { LessonTitleRow } from "@/lib/mock-test/weak-lessons";

type Props = {
  test: MockTestRow;
  questions: MockTestQuestionRow[];
  lessonTitles: LessonTitleRow[];
};

type Phase = "pick" | "run" | "done";

type Answered = {
  qNo: number;
  questionId: string;
  answer: string | null;
  isCorrect: boolean | null;
};

/** Хэсэг = ур чадвар + хэсгийн дугаар. Нэг удаад 5–25 асуулт. */
type PracticeGroup = {
  key: string;
  skill: string;
  part: number;
  desc: string;
  questions: MockTestQuestionRow[];
};

function partDescription(test: MockTestRow, skill: string, part: number): string {
  const section = test.sections.find((item) => item.skill === skill);
  const meta = section?.parts?.find((item) => item.part === part);
  return meta?.desc?.trim() || `${part}-р хэсэг`;
}

function buildGroups(
  test: MockTestRow,
  questions: MockTestQuestionRow[]
): PracticeGroup[] {
  const byKey = new Map<string, PracticeGroup>();
  for (const question of questions) {
    const key = `${question.skill}:${question.part}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        skill: question.skill,
        part: question.part,
        desc: partDescription(test, question.skill, question.part),
        questions: [],
      };
      byKey.set(key, group);
    }
    group.questions.push(question);
  }
  return [...byKey.values()].sort((a, b) => {
    const order = ["listening", "reading", "writing"];
    const diff = order.indexOf(a.skill) - order.indexOf(b.skill);
    if (diff !== 0) return diff;
    return a.part - b.part;
  });
}

export function MockTestPracticeClient({ test, questions, lessonTitles }: Props) {
  useActivityTracker("mock", test.id);

  const groups = useMemo(() => buildGroups(test, questions), [test, questions]);
  const lessonTitleById = useMemo(
    () => new Map(lessonTitles.map((row) => [row.id, row.title])),
    [lessonTitles]
  );

  const [phase, setPhase] = useState<Phase>("pick");
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [answered, setAnswered] = useState<Answered[]>([]);

  const activeGroup = groups.find((group) => group.key === groupKey) ?? null;
  const activeQuestions = activeGroup?.questions ?? [];
  const question = activeQuestions[index] ?? null;
  const getElapsed = useQuestionTimer(question?.id ?? "none");

  const correctCount = answered.filter((row) => row.isCorrect === true).length;
  const wrongCount = answered.filter((row) => row.isCorrect === false).length;

  const startGroup = useCallback((key: string) => {
    setGroupKey(key);
    setIndex(0);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
    setAnswered([]);
    setPhase("run");
  }, []);

  const record = useCallback(
    (current: MockTestQuestionRow, value: string | null, isCorrect: boolean | null) => {
      if (isCorrect == null) return;
      recordQuestionAttempt({
        lessonId: test.id,
        // Шалгалтын асуулт тул «шалгалт» гэсэн ангилалд бичнэ — ингэснээр
        // «Миний сул тал» дэлгэц дээр нэг дор нийлж харагдана.
        stage: "mock_exam",
        questionId: `mock:${current.id}`,
        questionType: mapMockQuestionType(current.q_type),
        isCorrect,
        selectedAnswer: value,
        correctAnswer: current.correct_answer,
        timeSpentMs: getElapsed(),
      });
    },
    [test.id, getElapsed]
  );

  const handleAnswer = useCallback(
    (value: string) => {
      if (!question || revealed) return;
      const built = buildPracticeFeedback(question, value);
      setAnswer(value);
      setFeedback(built);
      setRevealed(true);

      if (!isSelfGradedPracticeQuestion(question)) {
        record(question, value, built.isCorrect);
        setAnswered((prev) => [
          ...prev,
          {
            qNo: question.q_no,
            questionId: question.id,
            answer: value,
            isCorrect: built.isCorrect,
          },
        ]);
      }
    },
    [question, revealed, record]
  );

  const handleSelfGrade = useCallback(
    (isCorrect: boolean) => {
      if (!question) return;
      const built = buildPracticeFeedback(question, answer, isCorrect);
      setFeedback(built);
      record(question, answer, isCorrect);
      setAnswered((prev) =>
        prev.some((row) => row.questionId === question.id)
          ? prev
          : [
              ...prev,
              {
                qNo: question.q_no,
                questionId: question.id,
                answer,
                isCorrect,
              },
            ]
      );
    },
    [question, answer, record]
  );

  const goNext = useCallback(() => {
    if (index + 1 >= activeQuestions.length) {
      setPhase("done");
      return;
    }
    setIndex((value) => value + 1);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
  }, [index, activeQuestions.length]);

  // «Мэдэхгүй» гэдэг нь бодит мэдээлэл — алдаатай адилаар бүртгэнэ, ингэснээр
  // алдааны дэвтэр, сул талын задаргаанд нь орно.
  const skip = useCallback(() => {
    if (!question || revealed) return;
    const built = buildPracticeFeedback(question, null);
    setFeedback(built);
    setRevealed(true);
    setAnswer(null);

    if (!isSelfGradedPracticeQuestion(question)) {
      record(question, null, false);
      setAnswered((prev) => [
        ...prev,
        {
          qNo: question.q_no,
          questionId: question.id,
          answer: null,
          isCorrect: false,
        },
      ]);
    }
  }, [question, revealed, record]);

  // ---------------------------------------------------------------- pick ---
  if (phase === "pick" || !activeGroup || !question) {
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <Link href="/review/practice" className="bs-mtp-back">
            ← Дасгалын жагсаалт
          </Link>
          <h1 className="bs-mtp-title">{test.title}</h1>
          <p className="bs-mtp-sub">
            Сурах горим · цаг хэмжихгүй · алдсан бүрд тайлбар гарна
          </p>

          <div className="bs-mtp-note">
            Энэ бол шалгалт биш. Хариулт сонгонгуут зөв нь ямар байсныг шууд
            харуулна. Сонсголын аудиог хэдэн ч удаа сонсож болно.
          </div>

          <p className="bs-mtp-sec">Аль хэсгээс эхлэх вэ?</p>
          <div className="bs-mtp-group-list">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                className="bs-mtp-group"
                onClick={() => startGroup(group.key)}
              >
                <span className="bs-mtp-group-skill">
                  {SKILL_LABELS_MN[group.skill] ?? group.skill}
                </span>
                <span className="bs-mtp-group-desc">{group.desc}</span>
                <span className="bs-mtp-group-meta">
                  {group.questions.length} асуулт ·{" "}
                  {group.questions[0]?.q_no}–
                  {group.questions[group.questions.length - 1]?.q_no}
                </span>
              </button>
            ))}
          </div>
        </div>
      </MobileAppShell>
    );
  }

  // ---------------------------------------------------------------- done ---
  if (phase === "done") {
    const graded = answered.filter((row) => row.isCorrect != null);
    const wrong = answered.filter((row) => row.isCorrect === false);
    const percent =
      graded.length > 0
        ? Math.round((correctCount / graded.length) * 100)
        : null;

    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <h1 className="bs-mtp-title">{activeGroup.desc}</h1>
          <p className="bs-mtp-sub">
            {SKILL_LABELS_MN[activeGroup.skill] ?? activeGroup.skill} ·{" "}
            {activeQuestions.length} асуулт
          </p>

          <div className="bs-mtp-score">
            <p className="bs-mtp-score-big">
              {percent == null ? "—" : `${percent}%`}
            </p>
            <p className="bs-mtp-score-meta">
              {correctCount} зөв · {wrongCount} буруу
            </p>
          </div>

          {wrong.length > 0 ? (
            <div className="bs-mtp-wrong">
              <p className="bs-mtp-sec">Дахин үзэх асуултууд</p>
              <div className="bs-mtp-wrong-list">
                {wrong.map((row) => {
                  const source = activeQuestions.find(
                    (item) => item.id === row.questionId
                  );
                  const lessonId = source?.target_lesson_id ?? null;
                  const lessonTitle = lessonId
                    ? lessonTitleById.get(lessonId)
                    : null;
                  return (
                    <div key={row.questionId} className="bs-mtp-wrong-row">
                      <span className="bs-mtp-wrong-no">№{row.qNo}</span>
                      <span className="bs-mtp-wrong-text hanzi">
                        {source?.stem?.trim() ||
                          source?.options
                            ?.map((opt) => opt.text)
                            .filter(Boolean)
                            .join(" / ") ||
                          "—"}
                      </span>
                      {lessonId && lessonTitle ? (
                        <Link
                          href={`/lessons/${lessonId}`}
                          className="bs-mtp-wrong-lesson"
                        >
                          {lessonTitle} →
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="bs-mtp-note">
              Энэ хэсэгт алдаагүй дуусгалаа. Дараагийн хэсэг рүү оръё.
            </p>
          )}

          <div className="bs-mtp-done-actions">
            <button
              type="button"
              className="bs-mtp-primary"
              onClick={() => startGroup(activeGroup.key)}
            >
              Энэ хэсгийг дахин
            </button>
            <button
              type="button"
              className="bs-mtp-secondary"
              onClick={() => {
                setPhase("pick");
                setGroupKey(null);
              }}
            >
              Өөр хэсэг сонгох
            </button>
            <Link href="/review/weak-spots" className="bs-mtp-secondary">
              Миний сул тал →
            </Link>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  // ----------------------------------------------------------------- run ---
  const progressPercent = Math.round(
    ((index + (revealed ? 1 : 0)) / activeQuestions.length) * 100
  );
  const lessonId = feedback?.lessonId ?? null;
  const lessonTitle = lessonId ? lessonTitleById.get(lessonId) : null;
  const canAdvance =
    revealed &&
    (feedback?.isCorrect != null || !isSelfGradedPracticeQuestion(question));

  return (
    <MobileAppShell activeTab="study" showBottomNav>
      <div className="bs-mtp-wrap">
        <div className="bs-mtp-runbar">
          <button
            type="button"
            className="bs-mtp-back"
            onClick={() => {
              setPhase("pick");
              setGroupKey(null);
            }}
          >
            ← Гарах
          </button>
          <span className="bs-mtp-counter">
            {index + 1} / {activeQuestions.length}
          </span>
          <span className="bs-mtp-tally">
            <b className="bs-mtp-tally-ok">{correctCount}</b>
            <span aria-hidden>·</span>
            <b className="bs-mtp-tally-bad">{wrongCount}</b>
          </span>
        </div>

        <div className="bs-mtp-progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="bs-mtp-group-line">
          {SKILL_LABELS_MN[activeGroup.skill] ?? activeGroup.skill} ·{" "}
          {activeGroup.desc}
        </p>

        <MockTestPracticeQuestion
          question={question}
          answer={answer}
          revealed={revealed}
          onAnswer={handleAnswer}
          onSelfGrade={handleSelfGrade}
          feedback={feedback}
        />

        {revealed && lessonId && lessonTitle ? (
          <Link href={`/lessons/${lessonId}`} className="bs-mtp-lesson-link">
            📘 Холбоотой хичээл: {lessonTitle} →
          </Link>
        ) : null}

        <div className="bs-mtp-footer">
          {!revealed ? (
            <button type="button" className="bs-mtp-secondary" onClick={skip}>
              Мэдэхгүй — хариултыг нь харах
            </button>
          ) : (
            <button
              type="button"
              className="bs-mtp-primary"
              disabled={!canAdvance}
              onClick={goNext}
            >
              {index + 1 >= activeQuestions.length
                ? "Дүнг харах"
                : "Дараагийн асуулт →"}
            </button>
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
