"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  type PracticeFeedback,
} from "@/lib/mock-test/practice-feedback";
import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import { saveDailyListeningResult } from "@/lib/listen/daily-listening-local";

type Props = {
  level: number;
  dateKey: string;
  salt: string;
  questions: MockTestQuestionRow[];
  testCount: number;
  /** test_id → гарчиг (жнь «2013 оны жинхэнэ шалгалт №29») */
  testTitles: Record<string, string>;
};

type Answered = {
  question: MockTestQuestionRow;
  answer: string | null;
  isCorrect: boolean;
};

/**
 * «Өнөөдрийн сонсгол 10» — жинхэнэ шалгалтуудын сонсголын асуултаас санамсаргүй
 * 10. Асуулт бүр өөрийн аудио хэсгээ (20–40 с) тоглуулна. Хариулт бүр
 * question_attempts-д (stage mock_exam) бичигдэнэ → skill map, алдааны дэвтэр.
 */
export function DailyListeningClient({
  level,
  dateKey,
  salt,
  questions,
  testCount,
  testTitles,
}: Props) {
  useActivityTracker("mock", `daily-listen-${level}`);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [done, setDone] = useState(false);

  const question = questions[index] ?? null;
  const getElapsed = useQuestionTimer(question?.id ?? "none");

  const correctCount = answered.filter((r) => r.isCorrect).length;
  const wrongCount = answered.length - correctCount;

  const record = useCallback(
    (q: MockTestQuestionRow, value: string | null, isCorrect: boolean) => {
      recordQuestionAttempt({
        lessonId: q.test_id,
        stage: "mock_exam",
        questionId: `mock:${q.id}`,
        questionType: mapMockQuestionType(q.q_type),
        isCorrect,
        selectedAnswer: value,
        correctAnswer: q.correct_answer,
        timeSpentMs: getElapsed(),
      });
    },
    [getElapsed]
  );

  const handleAnswer = useCallback(
    (value: string) => {
      if (!question || revealed) return;
      const built = buildPracticeFeedback(question, value);
      setAnswer(value);
      setFeedback(built);
      setRevealed(true);
      const ok = built.isCorrect === true;
      record(question, value, ok);
      setAnswered((prev) => [...prev, { question, answer: value, isCorrect: ok }]);
    },
    [question, revealed, record]
  );

  const skip = useCallback(() => {
    if (!question || revealed) return;
    setFeedback(buildPracticeFeedback(question, null));
    setRevealed(true);
    setAnswer(null);
    record(question, null, false);
    setAnswered((prev) => [...prev, { question, answer: null, isCorrect: false }]);
  }, [question, revealed, record]);

  const goNext = useCallback(() => {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((v) => v + 1);
    setAnswer(null);
    setRevealed(false);
    setFeedback(null);
  }, [index, questions.length]);

  // Дууссан → нүүрний картад харуулах зорилгоор локалд хадгална.
  useEffect(() => {
    if (!done) return;
    saveDailyListeningResult({
      dateKey,
      level,
      correct: correctCount,
      total: answered.length,
    });
  }, [done, dateKey, level, correctCount, answered.length]);

  const nextSalt = String(Date.now() % 100000);

  if (!question) {
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <p className="bs-mtp-note">Энэ түвшинд аудиотой сонсголын асуулт олдсонгүй.</p>
          <Link href="/review/practice" className="bs-mtp-secondary">Дасгалын жагсаалт →</Link>
        </div>
      </MobileAppShell>
    );
  }

  if (done) {
    const percent = answered.length ? Math.round((correctCount / answered.length) * 100) : 0;
    const wrong = answered.filter((r) => !r.isCorrect);
    return (
      <MobileAppShell activeTab="study" showBottomNav>
        <div className="bs-mtp-wrap">
          <h1 className="bs-mtp-title">Өнөөдрийн сонсгол · HSK {level}</h1>
          <p className="bs-mtp-sub">{questions.length} асуулт · {testCount} жинхэнэ шалгалтаас</p>

          <div className="bs-mtp-score">
            <p className="bs-mtp-score-big">{percent}%</p>
            <p className="bs-mtp-score-meta">{correctCount} зөв · {wrongCount} буруу</p>
          </div>

          {wrong.length > 0 ? (
            <div className="bs-mtp-wrong">
              <p className="bs-mtp-sec">Алдсан асуултууд — алдааны дэвтэрт орлоо</p>
              <div className="bs-mtp-wrong-list">
                {wrong.map(({ question: q }) => (
                  <div key={q.id} className="bs-mtp-wrong-row">
                    <span className="bs-mtp-wrong-no">№{q.q_no}</span>
                    <span className="bs-mtp-wrong-text hanzi" translate="no">
                      {q.stem?.trim() || q.options?.map((o) => o.text).filter(Boolean).join(" / ") || "—"}
                    </span>
                    <Link href={`/review/practice/${q.test_id}`} className="bs-mtp-wrong-lesson">
                      <span translate="no">{testTitles[q.test_id] ?? q.test_id}</span> →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="bs-mtp-note">Бүгдийг зөв сонслоо. Маргааш шинэ 10 хүлээж байна.</p>
          )}

          <div className="bs-mtp-done-actions">
            <Link href={`/listen/daily?level=${level}&r=${nextSalt}`} className="bs-mtp-primary">
              Дахин 10 шинэ асуулт
            </Link>
            <Link href="/review/mistakes/zhenti" className="bs-mtp-secondary">
              Алдааны дэвтэр →
            </Link>
            <Link href="/home" className="bs-mtp-secondary">
              Нүүр хуудас
            </Link>
          </div>
        </div>
      </MobileAppShell>
    );
  }

  const progressPercent = Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100);
  const title = testTitles[question.test_id] ?? question.test_id;

  return (
    <MobileAppShell activeTab="study" showBottomNav>
      <div className="bs-mtp-wrap">
        <div className="bs-mtp-runbar">
          <Link href="/home" className="bs-mtp-back">← Гарах</Link>
          <span className="bs-mtp-counter">{index + 1} / {questions.length}</span>
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
          🎧 Өнөөдрийн сонсгол · HSK {level} · <span translate="no">{title}</span> №{question.q_no}
        </p>

        <MockTestPracticeQuestion
          key={question.id}
          question={question}
          answer={answer}
          revealed={revealed}
          onAnswer={handleAnswer}
          onSelfGrade={() => undefined}
          feedback={feedback}
          hideAudio={false}
          prefetchAudioUrls={questions.slice(index + 1, index + 3).map((q) => q.audio_url)}
        />

        <div className="bs-mtp-footer">
          {!revealed ? (
            <button type="button" className="bs-mtp-secondary" onClick={skip}>
              Мэдэхгүй — хариултыг нь харах
            </button>
          ) : (
            <button type="button" className="bs-mtp-primary" onClick={goNext}>
              {index + 1 >= questions.length ? "Дүнг харах" : "Дараагийн асуулт →"}
            </button>
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
