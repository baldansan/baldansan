"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  buildWeeklyReportMarkdown,
} from "@/lib/engagement/weekly-report";
import { getWeeklyReportUnified } from "@/lib/engagement/engagement-service";
import type { WeeklyProgressReport } from "@/lib/engagement/types";

export function WeeklyReportView() {
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState<WeeklyProgressReport | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void getWeeklyReportUnified().then((data) => {
      setReport(data);
      setReady(true);
    });
  }, []);

  if (!ready || !report) {
    return (
      <PublicPageShell>
        <p className="py-16 text-center text-sm text-slate-500">Ачааллаж байна…</p>
      </PublicPageShell>
    );
  }

  const markdown = buildWeeklyReportMarkdown(report);

  return (
    <PublicPageShell>
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Weekly report</h1>
        <p className="mt-2 text-slate-600">
          {report.weekStart} → {report.weekEnd}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Lessons completed", value: report.lessonsCompleted },
          { label: "Words learned", value: report.wordsLearned },
          { label: "Quiz attempts", value: report.quizAttempts },
          {
            label: "Avg quiz score",
            value: report.averageQuizScore != null ? `${report.averageQuizScore}%` : "—",
          },
          { label: "Active days", value: report.activeDays },
          { label: "Streak", value: report.currentStreak },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-emerald-50/70 p-5 ring-1 ring-emerald-200">
        <h2 className="font-semibold text-emerald-900">Recommendation</h2>
        <p className="mt-2 text-sm text-emerald-800">{report.recommendation}</p>
        {report.achievementsEarned.length > 0 ? (
          <p className="mt-3 text-sm text-emerald-800">
            Achievements: {report.achievementsEarned.join(", ")}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
          }}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {copied ? "Copied!" : "Copy report"}
        </button>
        <a
          href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`}
          download={`weekly-report-${report.weekStart}.md`}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800"
        >
          Download markdown
        </a>
        <Link
          href="/courses/hsk5"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Үргэлжлүүлэх
        </Link>
        <Link
          href="/review"
          className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Үг давтах
        </Link>
      </div>
    </PublicPageShell>
  );
}
