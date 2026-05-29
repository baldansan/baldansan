"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import { DailyGoalCard } from "@/components/retention/daily-goal-card";
import { STUDY_PLAN_DAYS } from "@/lib/engagement/engagement-service";
import { getStreakUnified } from "@/lib/retention/retention-service";
import type { LearningRetentionSummary } from "@/lib/retention/types";

export function StudyPlanView() {
  const [retention, setRetention] = useState<LearningRetentionSummary | null>(null);

  useEffect(() => {
    void getStreakUnified().then(setRetention);
  }, []);

  return (
    <PublicPageShell>
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Study plan</h1>
        <p className="mt-2 text-slate-600">
          7 хоногийн санал болгосон сургалтын төлөвлөгөө.
        </p>
      </section>

      {retention ? <DailyGoalCard summary={retention} /> : null}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Suggested weekly plan</h2>
        <ul className="mt-4 space-y-2">
          {STUDY_PLAN_DAYS.map((item) => (
            <li
              key={item.day}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50/60 px-4 py-3 ring-1 ring-emerald-100"
            >
              <span className="font-medium text-slate-900">{item.day}</span>
              <span className="text-sm text-slate-600">{item.task}</span>
              <Link
                href={item.href}
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                Start →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">
          Custom calendar sync дараагийн шатанд нэмэгдэнэ.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/courses/hsk5"
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start today
          </Link>
          <Link
            href="/reminders"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800"
          >
            Set reminder
          </Link>
          <Link
            href="/weekly-report"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            View weekly report
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
