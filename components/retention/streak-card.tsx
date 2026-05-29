"use client";

import Link from "next/link";
import type { LearningRetentionSummary } from "@/lib/retention/types";
import { RetentionSourceNote } from "@/components/retention/retention-source-note";

type Props = {
  summary: LearningRetentionSummary;
  showDailyReview?: boolean;
};

export function StreakCard({ summary, showDailyReview = true }: Props) {
  const { goalProgress } = summary;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-100">Streak</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold">{summary.currentStreak}</span>
            <span className="text-sm text-emerald-100">өдөр</span>
          </p>
          {summary.longestStreak > summary.currentStreak ? (
            <p className="mt-1 text-xs text-emerald-100">
              Хамгийн урт: {summary.longestStreak} өдөр
            </p>
          ) : null}
        </div>

        <div className="rounded-xl bg-white/15 px-4 py-3 text-right ring-1 ring-white/20">
          <p className="text-xs font-medium text-emerald-100">Өдрийн зорилго</p>
          <p className="mt-1 text-2xl font-bold">{goalProgress.overallPercent}%</p>
          <p className="text-xs text-emerald-100">
            {goalProgress.overallMet ? "✓ биелсэн" : "үргэлжлүүл"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-emerald-100">
          <span>Өнөөдрийн ахиц</span>
          <span>{goalProgress.overallPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-800/40">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${goalProgress.overallPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-emerald-50">
          Хичээл {summary.today.lessonEvents}/{summary.goal.lessonsPerDay} · Үг{" "}
          {summary.today.wordEvents}/{summary.goal.wordsPerDay} · Quiz{" "}
          {summary.today.quizEvents}/{summary.goal.quizzesPerDay}
        </p>
      </div>

      <div className="mt-3">
        <RetentionSourceNote
          source={summary.source}
          label={summary.sourceLabel}
        />
      </div>

      {showDailyReview ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/review"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {goalProgress.overallMet ? "Daily review" : "Өнөөдрийн review"}
          </Link>
          {!goalProgress.overallMet ? (
            <Link
              href="/courses/hsk5"
              className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Зорилгоо биелүүлэх
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
