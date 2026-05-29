"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { ImprovementPromptCopyButton } from "@/components/admin/improvement-prompt-card";
import { buildQuestionImprovementPrompt } from "@/lib/admin/improvement-prompts";
import { PerformanceBadge } from "@/components/admin/performance-badge";
import type { QuestionAnalyticsRow } from "@/lib/supabase/admin-analytics";

type AccuracyFilter = "all" | "below70" | "70-89" | "90plus";
type TypeFilter = "all" | "multiple_choice" | "cloze";

type Props = {
  overview: {
    totalQuizAttempts: number;
    totalAnsweredQuestions: number;
    averageQuestionAccuracy: number | null;
    difficultQuestionsCount: number;
    questions: QuestionAnalyticsRow[];
    hasDetailedAnswers: boolean;
    warnings: string[];
  };
  initialLessonFilter?: string;
};

function formatAccuracy(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

export function QuestionInsightsView({ overview, initialLessonFilter }: Props) {
  const [query, setQuery] = useState("");
  const [lessonFilter, setLessonFilter] = useState(initialLessonFilter ?? "all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [accuracyFilter, setAccuracyFilter] = useState<AccuracyFilter>("all");

  const lessonOptions = useMemo(() => {
    const ids = new Map<string, string>();
    for (const row of overview.questions) {
      ids.set(row.lessonId, row.lessonTitle);
    }
    return [...ids.entries()].sort(
      (a, b) => Number(a[0]) - Number(b[0])
    );
  }, [overview.questions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return overview.questions.filter((row) => {
      if (lessonFilter !== "all" && row.lessonId !== lessonFilter) return false;
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (accuracyFilter === "below70") {
        if (row.accuracyPercent == null || row.accuracyPercent >= 70) return false;
      } else if (accuracyFilter === "70-89") {
        if (
          row.accuracyPercent == null ||
          row.accuracyPercent < 70 ||
          row.accuracyPercent >= 90
        ) {
          return false;
        }
      } else if (accuracyFilter === "90plus") {
        if (row.accuracyPercent == null || row.accuracyPercent < 90) return false;
      }
      if (!q) return true;
      return (
        row.question.toLowerCase().includes(q) ||
        row.lessonTitle.toLowerCase().includes(q) ||
        row.correctAnswer.toLowerCase().includes(q)
      );
    });
  }, [overview.questions, query, lessonFilter, typeFilter, accuracyFilter]);

  const difficult = useMemo(
    () => filtered.filter((row) => row.needsReview),
    [filtered]
  );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Question insights
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Quiz асуулт бүрийн зөв/буруу хариултын үзүүлэлт, хүндрэлтэй
          асуултууд.
        </p>
      </section>

      {overview.warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Analytics notes</p>
          <ul className="mt-2 list-inside list-disc">
            {overview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnalyticsMetricCard
            label="Total quiz attempts"
            value={overview.totalQuizAttempts}
          />
          <AnalyticsMetricCard
            label="Answered questions"
            value={overview.totalAnsweredQuestions}
          />
          <AnalyticsMetricCard
            label="Avg question accuracy"
            value={formatAccuracy(overview.averageQuestionAccuracy)}
          />
          <AnalyticsMetricCard
            label="Difficult questions"
            value={overview.difficultQuestionsCount}
            hint="Accuracy below 70%"
          />
        </div>
      </section>

      {!overview.hasDetailedAnswers ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Question-level analytics quiz attempts дотор detailed answers
            хадгалагдсаны дараа харагдана.
          </p>
          <Link
            href="/lessons/1/quiz"
            className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Go to quiz
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              Difficult questions
            </h2>
            {difficult.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No difficult questions match current filters.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Lesson</th>
                      <th className="px-4 py-3">Question</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Attempts</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Correct</th>
                      <th className="px-4 py-3">Common wrong</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {difficult.map((row) => (
                      <tr key={`${row.lessonId}-${row.questionKey}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">{row.lessonId}</span>
                          <p className="text-xs text-slate-500">{row.lessonTitle}</p>
                        </td>
                        <td className="max-w-xs px-4 py-3">{row.question}</td>
                        <td className="px-4 py-3">{row.type}</td>
                        <td className="px-4 py-3">{row.attemptsCount}</td>
                        <td className="px-4 py-3">
                          <PerformanceBadge
                            kind={
                              row.accuracyPercent == null
                                ? "none"
                                : row.accuracyPercent >= 70
                                  ? "high"
                                  : "low"
                            }
                            label={formatAccuracy(row.accuracyPercent)}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs">{row.correctAnswer}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {row.mostCommonWrongAnswers.length > 0
                            ? row.mostCommonWrongAnswers.join(", ")
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs">
                            <Link
                              href={`/admin/analytics/lessons/${row.lessonId}`}
                              className="font-medium text-emerald-700 hover:text-emerald-800"
                            >
                              Analytics
                            </Link>
                            <Link
                              href={`/admin/lessons/${row.lessonId}/edit`}
                              className="font-medium text-slate-600 hover:text-emerald-700"
                            >
                              Edit
                            </Link>
                            <ImprovementPromptCopyButton
                              label="Generate fix prompt"
                              prompt={buildQuestionImprovementPrompt(row)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              All questions
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <input
                type="search"
                placeholder="Search question text…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={lessonFilter}
                onChange={(e) => setLessonFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">All lessons</option>
                {lessonOptions.map(([id, title]) => (
                  <option key={id} value={id}>
                    {id} — {title}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">All types</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="cloze">Cloze</option>
              </select>
              <select
                value={accuracyFilter}
                onChange={(e) =>
                  setAccuracyFilter(e.target.value as AccuracyFilter)
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">All accuracy</option>
                <option value="below70">Below 70%</option>
                <option value="70-89">70–89%</option>
                <option value="90plus">90%+</option>
              </select>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Showing {filtered.length} question(s)
            </p>
            {filtered.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No questions match.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Lesson</th>
                      <th className="px-4 py-3">Question</th>
                      <th className="px-4 py-3">Attempts</th>
                      <th className="px-4 py-3">Accuracy</th>
                      <th className="px-4 py-3">Review</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((row) => (
                      <tr key={`all-${row.lessonId}-${row.questionKey}`}>
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.lessonId}
                        </td>
                        <td className="max-w-md px-4 py-3">{row.question}</td>
                        <td className="px-4 py-3">{row.attemptsCount}</td>
                        <td className="px-4 py-3">
                          {formatAccuracy(row.accuracyPercent)}
                        </td>
                        <td className="px-4 py-3">
                          {row.needsReview ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                              Needs review
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ImprovementPromptCopyButton
                            label="Generate fix prompt"
                            prompt={buildQuestionImprovementPrompt(row)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/analytics"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Back to analytics
        </Link>
        <Link
          href="/admin/analytics/vocabulary"
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Vocabulary insights
        </Link>
      </div>
    </div>
  );
}
