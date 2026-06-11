"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MockTestQuestion } from "@/components/mock-test/mock-test-question";
import { MobileAppShell } from "@/components/mobile/mobile-app-shell";
import { scoreMockTestAttempt } from "@/lib/mock-test/scoring";
import {
  SKILL_LABELS_MN,
  type MockTestAnswers,
  type MockTestQuestionRow,
  type MockTestRow,
  type MockTestScoreResult,
} from "@/lib/mock-test/types";
import { saveCheckpointAttempt } from "@/lib/supabase/mock-tests-client";

type Phase = "intro" | "exam" | "result";

type Props = {
  test: MockTestRow;
  questions: MockTestQuestionRow[];
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function skillList(test: MockTestRow): string[] {
  const fromSections = test.sections.map((s) => s.skill).filter(Boolean);
  if (fromSections.length) return [...new Set(fromSections)];
  return ["listening", "reading", "writing"];
}

export function MockTestExamClient({ test, questions }: Props) {
  const skills = useMemo(() => skillList(test), [test]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [skill, setSkill] = useState(skills[0] ?? "listening");
  const [answers, setAnswers] = useState<MockTestAnswers>({});
  const [secondsLeft, setSecondsLeft] = useState(test.time_limit_min * 60);
  const [result, setResult] = useState<MockTestScoreResult | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const sectionMeta = useMemo(
    () => test.sections.find((s) => s.skill === skill),
    [test.sections, skill]
  );

  const skillQuestions = useMemo(
    () => questions.filter((q) => q.skill === skill),
    [questions, skill]
  );

  const finishExam = useCallback(async () => {
    const scored = scoreMockTestAttempt(questions, answers);
    setResult(scored);
    setPhase("result");

    const save = await saveCheckpointAttempt(test.id, scored);
    if (save.ok) {
      setSaveNote("Оролдлого бүртгэгдлээ.");
    } else if (save.error === "Нэвтрээгүй хэрэглэгч.") {
      setSaveNote("Зочин горим — оноо зөвхөн энэ удаа харагдана.");
    } else if (save.error) {
      setSaveNote(save.error);
    }
  }, [answers, questions, test.id]);

  useEffect(() => {
    if (phase !== "exam") return;
    if (secondsLeft <= 0) {
      void finishExam();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft, finishExam]);

  function setAnswer(qNo: number, value: string) {
    setAnswers((prev) => ({ ...prev, [String(qNo)]: value }));
  }

  function startExam() {
    setSecondsLeft(test.time_limit_min * 60);
    setSkill(skills[0] ?? "listening");
    setPhase("exam");
  }

  if (phase === "intro") {
    return (
      <MobileAppShell activeTab="games" showBottomNav={false} mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8">
        <div className="bs-mt-intro px-4">
          <Link href="/review" className="bs-mem-back">
            ← Давтах
          </Link>
          <h1 className="bs-mt-title mt-3">{test.title}</h1>
          <p className="bs-mt-sub">HSK {test.hsk_level} · {test.id}</p>
          <div className="bs-mock-info-card mt-4">
            <p className="bs-mock-info-row">
              <span>Хугацаа</span>
              <strong>{test.time_limit_min} мин</strong>
            </p>
            <p className="bs-mock-info-row">
              <span>Асуулт</span>
              <strong>{test.total_questions}</strong>
            </p>
            <p className="bs-mock-info-row">
              <span>Хэсэг</span>
              <strong>
                {skills.map((s) => SKILL_LABELS_MN[s] ?? s).join(", ")}
              </strong>
            </p>
          </div>
          <ul className="bs-mock-rules mt-4">
            <li>Таймер эхэлсний дараа буурна — дуусахад автоматаар илгээнэ</li>
            <li>Сонсголд бүтэн аудио нэг удаа сонсоно</li>
            <li>Ихэнх асуулт автоматаар оноо тооцогдоно</li>
            <li>Эссэ, хураангуй гэх мэт хэсэг дараа нь үнэлэгдэнэ</li>
          </ul>
          <button type="button" className="bs-mock-primary-btn mt-6" onClick={startExam}>
            Шалгалт эхлүүлэх
          </button>
        </div>
      </MobileAppShell>
    );
  }

  if (phase === "result" && result) {
    const pct =
      result.maxScore > 0
        ? Math.round((result.rawScore / result.maxScore) * 100)
        : 0;

    return (
      <MobileAppShell activeTab="games" showBottomNav={false} mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8">
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

          <Link href="/review" className="bs-mock-primary-btn mt-6 block text-center leading-[48px] no-underline">
            Буцах
          </Link>
        </div>
      </MobileAppShell>
    );
  }

  const timerPct = Math.max(
    0,
    Math.min(100, (secondsLeft / (test.time_limit_min * 60)) * 100)
  );
  const warn = secondsLeft < 300;

  return (
    <MobileAppShell activeTab="games" showBottomNav={false} mainClassName="max-w-[430px] mx-auto w-full px-0 pb-8">
      <div className="bs-mt-exam px-4">
        <div className="bs-mt-timer-bar">
          <span className="bs-mt-timer-text">
            {formatTime(secondsLeft)} үлдсэн
          </span>
          <div className="bs-mt-timer-track">
            <div
              className={`bs-mt-timer-fill ${warn ? "bs-mt-timer-fill--warn" : ""}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        <div className="bs-mt-section-nav">
          {skills.map((s) => (
            <button
              key={s}
              type="button"
              className={`bs-mt-section-btn ${skill === s ? "bs-mt-section-btn--active" : ""}`}
              onClick={() => setSkill(s)}
            >
              {SKILL_LABELS_MN[s] ?? s}
            </button>
          ))}
        </div>

        {sectionMeta?.audio_url ? (
          <div className="bs-mt-audio-wrap">
            <p className="bs-mt-audio-label">Сонсгол — бүтэн аудио</p>
            <audio controls src={sectionMeta.audio_url} className="bs-mt-audio" />
          </div>
        ) : null}

        <div className="bs-mt-questions">
          {skillQuestions.map((q) => (
            <MockTestQuestion
              key={q.id}
              question={q}
              answers={answers}
              onAnswer={setAnswer}
            />
          ))}
        </div>

        <button
          type="button"
          className="bs-mock-primary-btn mt-6 w-full"
          onClick={() => void finishExam()}
        >
          Дуусгах
        </button>
      </div>
    </MobileAppShell>
  );
}
