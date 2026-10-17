"use client";

import { useCallback, useEffect, useState } from "react";
// motion/react-гүй хөнгөн хувилбар — хичээлийн хуудасны эхний ачаалалд 44KB(gz) хэмнэнэ.
import { CountUpLite, ProgressBarLite } from "@/components/motion/progress-lite";
import { MobileCard } from "@/components/mobile/mobile-card";
import { LocalProgressNote } from "@/components/local-progress-note";
import {
  getStudiedWordsCount,
  quizStepSummary,
} from "@/lib/lesson/bs-step-progress";
import {
  getLessonStatusSmart,
  getQuizResultSmart,
  lessonProgressPercent,
  lessonStatusLabel,
  type LessonStatus,
} from "@/lib/progress";

type Props = {
  lessonId: string;
  quizCount?: number;
};

export function LessonProgressCard({ lessonId, quizCount = 0 }: Props) {
  const [status, setStatus] = useState<LessonStatus>("not_started");
  const [studiedWords, setStudiedWords] = useState(0);
  const [quizDetail, setQuizDetail] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      setStatus(await getLessonStatusSmart(lessonId));
      setStudiedWords(getStudiedWordsCount(lessonId));
      if (quizCount > 0) {
        const summary = quizStepSummary(lessonId, quizCount);
        setQuizDetail(summary.detail);
      } else {
        setQuizDetail(null);
      }
      const quiz = await getQuizResultSmart(lessonId);
      setBestScore(quiz?.bestPercentage ?? null);
    })();
  }, [lessonId, quizCount]);

  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const progressPercent = lessonProgressPercent(status);

  return (
    <MobileCard padding="lg">
      <h2 className="text-sm font-bold text-[var(--app-text)]">Таны ахиц</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="app-stat-pill">{lessonStatusLabel(status)}</span>
        <span className="app-stat-pill">{studiedWords} үг сурсан</span>
        {quizDetail && quizDetail !== "Эхлээгүй" ? (
          <span className="app-stat-pill app-stat-pill-accent">Quiz: {quizDetail}</span>
        ) : bestScore != null ? (
          <span className="app-stat-pill app-stat-pill-accent">
            Quiz: {bestScore}%
          </span>
        ) : null}
      </div>
      <ProgressBarLite value={progressPercent} className="mt-3" />
      <p className="mt-2 text-xs font-medium text-emerald-700">
        <CountUpLite value={progressPercent} suffix="% дууссан" />
      </p>
      <div className="mt-3">
        <LocalProgressNote />
      </div>
    </MobileCard>
  );
}
