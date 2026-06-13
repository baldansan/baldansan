"use client";

import { useMemo, useState } from "react";
import type {
  LessonAttemptAggregateRow,
  QuestionAttemptAggregateRow,
  QuestionAttemptStageFilter,
} from "@/lib/supabase/question-attempts-analytics";

const STAGE_OPTIONS: { value: QuestionAttemptStageFilter; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "grammar_exercise", label: "Дүрэм / дасгал" },
  { value: "quiz", label: "Сорил" },
  { value: "mock_exam", label: "Mock шалгалт" },
  { value: "word_practice", label: "Үг дасгал" },
];

const STAGE_LABEL: Record<string, string> = {
  grammar_exercise: "Дүрэм/дасгал",
  quiz: "Сорил",
  mock_exam: "Mock",
  word_practice: "Үг",
};

const TYPE_LABEL: Record<string, string> = {
  choice: "Сонголт",
  judge: "Үнэн/худал",
  order: "Эвлүүлэх",
  fill: "Нөхөх",
};

type Props = {
  totalAttempts: number;
  questionStats: QuestionAttemptAggregateRow[];
  warnings: string[];
};

function aggregateLessons(
  rows: QuestionAttemptAggregateRow[]
): LessonAttemptAggregateRow[] {
  const byLesson = new Map<string, LessonAttemptAggregateRow>();
  for (const row of rows) {
    const existing = byLesson.get(row.lessonId) ?? {
      lessonId: row.lessonId,
      totalAttempts: 0,
      correctCount: 0,
      correctPercent: 0,
    };
    existing.totalAttempts += row.totalAttempts;
    existing.correctCount += row.correctCount;
    byLesson.set(row.lessonId, existing);
  }
  return [...byLesson.values()]
    .map((row) => ({
      ...row,
      correctPercent:
        row.totalAttempts > 0
          ? Math.round((row.correctCount / row.totalAttempts) * 100)
          : 0,
    }))
    .sort((a, b) => a.correctPercent - b.correctPercent);
}

function WrongBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-red-400"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-slate-600">
        {percent}%
      </span>
    </div>
  );
}

function CorrectBar({ percent }: { percent: number }) {
  return (
    <div className="flex min-w-[88px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-slate-600">
        {percent}%
      </span>
    </div>
  );
}

export function QuestionAttemptsAnalyticsSection({
  totalAttempts,
  questionStats,
  warnings,
}: Props) {
  const [stage, setStage] = useState<QuestionAttemptStageFilter>("all");

  const filteredQuestions = useMemo(() => {
    const base =
      stage === "all"
        ? questionStats
        : questionStats.filter((row) => row.stage === stage);
    return [...base]
      .sort((a, b) => {
        if (b.wrongPercent !== a.wrongPercent) {
          return b.wrongPercent - a.wrongPercent;
        }
        return b.totalAttempts - a.totalAttempts;
      })
      .slice(0, 50);
  }, [questionStats, stage]);

  const filteredLessons = useMemo(
    () => aggregateLessons(filteredQuestions),
    [filteredQuestions]
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-section-title">Сурах аналитик — асуулт</h2>
          <p className="admin-section-desc">
            Асуулт бүрийн оролдлогоос ({totalAttempts.toLocaleString()} нийт).
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Стадиар шүүх</span>
          <select
            className="admin-input min-w-[180px]"
            value={stage}
            onChange={(e) =>
              setStage(e.target.value as QuestionAttemptStageFilter)
            }
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {warnings.length > 0 ? (
        <div className="admin-panel border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ul className="list-inside list-disc">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-panel overflow-x-auto p-0">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Хамгийн их алдаатай асуултууд
        </h3>
        {filteredQuestions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Өгөгдөл байхгүй.</p>
        ) : (
          <table className="admin-table w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                <th className="text-left">Хичээл</th>
                <th className="text-left">Асуулт ID</th>
                <th className="text-left">Стади</th>
                <th className="text-left">Төрөл</th>
                <th className="text-right">Оролдлого</th>
                <th className="text-left">Буруу %</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((row) => (
                <tr key={`${row.lessonId}-${row.questionId}-${row.stage}`}>
                  <td className="font-mono text-xs">{row.lessonId}</td>
                  <td className="font-mono text-xs">{row.questionId}</td>
                  <td>{STAGE_LABEL[row.stage] ?? row.stage}</td>
                  <td>{TYPE_LABEL[row.questionType] ?? row.questionType}</td>
                  <td className="text-right tabular-nums">
                    {row.totalAttempts}
                  </td>
                  <td>
                    <WrongBar percent={row.wrongPercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-panel overflow-x-auto p-0">
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Хичээл тус бүрийн дундаж зөв хувь
        </h3>
        {filteredLessons.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Өгөгдөл байхгүй.</p>
        ) : (
          <table className="admin-table w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th className="text-left">Хичээл</th>
                <th className="text-right">Оролдлого</th>
                <th className="text-left">Зөв %</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((row) => (
                <tr key={row.lessonId}>
                  <td className="font-mono text-xs">{row.lessonId}</td>
                  <td className="text-right tabular-nums">
                    {row.totalAttempts}
                  </td>
                  <td>
                    <CorrectBar percent={row.correctPercent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
