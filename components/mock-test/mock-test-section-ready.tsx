"use client";

import { SKILL_LABELS_MN } from "@/lib/mock-test/types";

type Props = {
  skillLabel: string;
  questionCount: number;
  minutes: number;
  sectionIndex: number;
  totalSections: number;
  isRealMode: boolean;
  onStart: () => void;
};

export function MockTestSectionReady({
  skillLabel,
  questionCount,
  minutes,
  sectionIndex,
  totalSections,
  isRealMode,
  onStart,
}: Props) {
  return (
    <div className="bs-mt-section-ready px-4">
      <p className="bs-mt-section-ready-kicker">
        {sectionIndex + 1}/{totalSections} хэсэг
      </p>
      <h2 className="bs-mt-section-ready-title">{skillLabel}</h2>
      <p className="bs-mt-section-ready-meta">
        {questionCount} асуулт · {minutes} минут
      </p>
      {isRealMode && skillLabel === SKILL_LABELS_MN.listening ? (
        <p className="bs-mt-section-ready-hint">
          Аудио автоматаар нэг удаа тоглоно. Дуусахаас өмнө дахин сонсох боломжгүй.
        </p>
      ) : null}
      {isRealMode ? (
        <p className="bs-mt-section-ready-hint">
          Цаг дуусахад энэ хэсэг автоматаар хаагдана. Өмнөх хэсэг рүү буцах боломжгүй.
        </p>
      ) : null}
      <button type="button" className="bs-mock-primary-btn mt-6" onClick={onStart}>
        Эхлэх →
      </button>
    </div>
  );
}
