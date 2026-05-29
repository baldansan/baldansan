"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { MediaStatusBadge } from "@/components/admin/media-status-badge";
import {
  completionPerformanceKind,
  PerformanceBadge,
  scorePerformanceKind,
} from "@/components/admin/performance-badge";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import type { LessonAnalyticsMetrics } from "@/lib/supabase/admin-analytics";
import type { AdminContentStatus } from "@/lib/admin/lesson-status";

type StatusFilter = "all" | AdminContentStatus;
type PerformanceFilter = "all" | "high" | "low" | "none";

type Props = {
  lessons: LessonAnalyticsMetrics[];
};

function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${rate}%`;
}

function formatScore(score: number | null): string {
  if (score == null) return "—";
  return `${score}%`;
}

function lessonNeedsAttention(lesson: LessonAnalyticsMetrics): boolean {
  if (lesson.quizAttemptCount === 0) return true;
  if (
    lesson.averageQuizPercentage != null &&
    lesson.averageQuizPercentage < 70 &&
    lesson.quizAttemptCount > 0
  ) {
    return true;
  }
  if (
    lesson.startedCount > 0 &&
    (lesson.completionRate == null || lesson.completionRate < 30)
  ) {
    return true;
  }
  if (lesson.quizQuestionCount === 0) return true;
  if (lesson.vocabularyCount === 0) return true;
  if (lesson.mediaStatus === "missing") return true;
  return false;
}

function attentionReasons(lesson: LessonAnalyticsMetrics): string[] {
  const reasons: string[] = [];
  if (lesson.quizAttemptCount === 0) reasons.push("No quiz attempts");
  if (
    lesson.averageQuizPercentage != null &&
    lesson.averageQuizPercentage < 70
  ) {
    reasons.push("Low avg score");
  }
  if (
    lesson.startedCount > 0 &&
    (lesson.completionRate == null || lesson.completionRate < 30)
  ) {
    reasons.push("Low completion");
  }
  if (lesson.quizQuestionCount === 0) reasons.push("Missing quiz");
  if (lesson.vocabularyCount === 0) reasons.push("Missing vocabulary");
  if (lesson.mediaStatus === "missing") reasons.push("Media missing");
  return reasons;
}

export function LessonAnalyticsTable({ lessons }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [performanceFilter, setPerformanceFilter] =
    useState<PerformanceFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lessons.filter((lesson) => {
      if (statusFilter !== "all" && lesson.status !== statusFilter) {
        return false;
      }

      const perfKind = completionPerformanceKind(
        lesson.completionRate,
        lesson.startedCount
      );
      if (performanceFilter === "high" && perfKind !== "high") return false;
      if (performanceFilter === "low" && perfKind !== "low") return false;
      if (performanceFilter === "none" && perfKind !== "none") return false;

      if (!q) return true;
      return (
        lesson.lessonId.toLowerCase().includes(q) ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.chineseTitle.toLowerCase().includes(q)
      );
    });
  }, [lessons, query, statusFilter, performanceFilter]);

  const needsAttention = useMemo(
    () => lessons.filter(lessonNeedsAttention),
    [lessons]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Хайх: id, гарчиг, 中文…"
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        >
          <option value="all">Status: All</option>
          <option value="draft">draft</option>
          <option value="available">available</option>
          <option value="archived">archived</option>
        </select>
        <select
          value={performanceFilter}
          onChange={(e) =>
            setPerformanceFilter(e.target.value as PerformanceFilter)
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
        >
          <option value="all">Performance: All</option>
          <option value="high">High completion</option>
          <option value="low">Low completion</option>
          <option value="none">No activity</option>
        </select>
      </div>

      {needsAttention.length > 0 ? (
        <section className="rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-100 sm:p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            Needs attention ({needsAttention.length})
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {needsAttention.map((lesson) => (
              <li
                key={lesson.lessonId}
                className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-mono text-xs text-slate-500">
                    {lesson.lessonId}
                  </span>{" "}
                  {lesson.title} — {attentionReasons(lesson).join(" · ")}
                </span>
                <Link
                  href={`/admin/analytics/lessons/${lesson.lessonId}`}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View details →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Lesson</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Started</th>
              <th className="px-3 py-3">Done</th>
              <th className="px-3 py-3">Completion</th>
              <th className="px-3 py-3">Quiz</th>
              <th className="px-3 py-3">Avg score</th>
              <th className="px-3 py-3">Words</th>
              <th className="px-3 py-3">QA / Media</th>
              <th className="px-3 py-3">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((lesson) => (
              <tr key={lesson.lessonId} className="align-top hover:bg-emerald-50/30">
                <td className="px-3 py-3">
                  <p className="font-mono text-xs text-slate-500">
                    {lesson.lessonId}
                  </p>
                  <p className="font-medium text-slate-900">{lesson.title}</p>
                  <p className="text-xs text-slate-500">{lesson.chineseTitle}</p>
                </td>
                <td className="px-3 py-3">
                  <LessonStatusBadge
                    status={lesson.status as AdminContentStatus}
                  />
                </td>
                <td className="px-3 py-3">{lesson.startedCount}</td>
                <td className="px-3 py-3">{lesson.completedCount}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span>{formatRate(lesson.completionRate)}</span>
                    <PerformanceBadge
                      kind={completionPerformanceKind(
                        lesson.completionRate,
                        lesson.startedCount
                      )}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">{lesson.quizAttemptCount}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <span>{formatScore(lesson.averageQuizPercentage)}</span>
                    <PerformanceBadge
                      kind={scorePerformanceKind(
                        lesson.averageQuizPercentage,
                        lesson.quizAttemptCount
                      )}
                    />
                  </div>
                </td>
                <td className="px-3 py-3">{lesson.learnedVocabularyCount}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-1">
                    <LessonQaBadge status={lesson.qaStatus} />
                    <MediaStatusBadge status={lesson.mediaStatus} />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex min-w-[6rem] flex-col gap-0.5 text-xs font-medium">
                    <Link
                      href={`/admin/analytics/lessons/${lesson.lessonId}`}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      View details
                    </Link>
                    <Link
                      href={`/admin/lessons/${lesson.lessonId}/edit`}
                      className="text-slate-600 hover:text-emerald-700"
                    >
                      Edit lesson
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            No lessons match filters.
          </p>
        ) : null}
      </div>
    </div>
  );
}
