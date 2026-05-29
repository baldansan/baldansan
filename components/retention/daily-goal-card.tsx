"use client";

import type { LearningRetentionSummary } from "@/lib/retention/types";
import { RetentionSourceNote } from "@/components/retention/retention-source-note";

type Props = {
  summary: LearningRetentionSummary;
};

export function DailyGoalCard({ summary }: Props) {
  const items = [
    {
      label: "Хичээл",
      current: summary.goalProgress.lessons.current,
      target: summary.goalProgress.lessons.target,
      met: summary.goalProgress.lessons.met,
    },
    {
      label: "Үг",
      current: summary.goalProgress.words.current,
      target: summary.goalProgress.words.target,
      met: summary.goalProgress.words.met,
    },
    {
      label: "Quiz",
      current: summary.goalProgress.quizzes.current,
      target: summary.goalProgress.quizzes.target,
      met: summary.goalProgress.quizzes.met,
    },
  ];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-200 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Өдрийн зорилго</h2>
      <p className="mt-1 text-sm text-slate-600">
        Өнөөдрийн сургалтын зорилго — хичээл, үг, quiz.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100"
          >
            <p className="text-xs font-medium text-slate-600">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {item.current}/{item.target}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {item.met ? "✓ биелсэн" : "үргэлжлүүлээрэй"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <RetentionSourceNote
          source={summary.source}
          label={summary.sourceLabel}
        />
      </div>
    </section>
  );
}
