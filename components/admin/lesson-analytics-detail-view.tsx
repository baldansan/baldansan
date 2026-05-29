import Link from "next/link";
import { LessonAnalyticsImprovementSection } from "@/components/admin/lesson-analytics-improvement-section";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { MediaStatusBadge } from "@/components/admin/media-status-badge";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import type { LessonAnalyticsDetail } from "@/lib/supabase/admin-analytics";
import type { AdminContentStatus } from "@/lib/admin/lesson-status";

type Props = {
  detail: LessonAnalyticsDetail;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${rate}%`;
}

export function LessonAnalyticsDetailView({ detail }: Props) {
  const {
    metrics,
    quiz,
    vocabulary,
    progress,
    questionPerformance,
    vocabularyEngagement,
    contentWarnings,
    warnings,
    hasDetailedQuizAnswers,
  } = detail;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-medium text-emerald-700">Lesson analytics</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {metrics.title}
        </h1>
        <p className="mt-1 text-lg text-slate-600">{metrics.chineseTitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-slate-500">
            ID {metrics.lessonId}
          </span>
          <LessonStatusBadge status={metrics.status as AdminContentStatus} />
          <LessonQaBadge status={metrics.qaStatus} />
          <MediaStatusBadge status={metrics.mediaStatus} />
        </div>
      </section>

      {warnings.length > 0 ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="font-semibold">Analytics notes</p>
          <ul className="mt-2 list-inside list-disc">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Started users"
            value={progress.startedCount}
          />
          <AnalyticsMetricCard
            label="Completed"
            value={progress.completedCount}
          />
          <AnalyticsMetricCard
            label="Completion rate"
            value={formatRate(progress.completionRate)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quiz performance</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnalyticsMetricCard label="Attempts" value={quiz.attemptCount} />
          <AnalyticsMetricCard
            label="Average score"
            value={formatRate(quiz.averagePercentage)}
          />
          <AnalyticsMetricCard
            label="Best score"
            value={formatRate(quiz.bestPercentage)}
          />
          <AnalyticsMetricCard
            label="Latest attempt"
            value={formatWhen(quiz.latestAttemptAt)}
            hint="Most recent quiz"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Vocabulary</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Total words"
            value={vocabulary.totalWords}
          />
          <AnalyticsMetricCard
            label="Learned rows"
            value={vocabulary.learnedRows}
          />
          <AnalyticsMetricCard
            label="Unique learned"
            value={vocabulary.uniqueLearnedWords}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Question performance
          </h2>
          <Link
            href={`/admin/analytics/questions?lesson=${metrics.lessonId}`}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            All question insights →
          </Link>
        </div>
        {!hasDetailedQuizAnswers ? (
          <p className="mt-3 text-sm text-slate-500">
            Question-level analytics quiz attempts дотор detailed answers
            хадгалагдсаны дараа харагдана. Older quiz attempts may not include
            detailed answer data.
          </p>
        ) : questionPerformance.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No per-question data for this lesson yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Accuracy</th>
                  <th className="px-4 py-3">Correct answer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questionPerformance.map((row) => (
                  <tr key={row.questionKey}>
                    <td className="max-w-md px-4 py-3">{row.question}</td>
                    <td className="px-4 py-3">{row.attemptsCount}</td>
                    <td className="px-4 py-3">
                      {formatRate(row.accuracyPercent)}
                      {row.needsReview ? (
                        <span className="ml-2 text-xs text-amber-700">
                          Needs review
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">{row.correctAnswer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Vocabulary engagement
          </h2>
          <Link
            href={`/admin/analytics/vocabulary?lesson=${metrics.lessonId}`}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            All vocabulary insights →
          </Link>
        </div>
        {vocabularyEngagement.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No vocabulary words for this lesson.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Word</th>
                  <th className="px-4 py-3">Learned count</th>
                  <th className="px-4 py-3">HSK</th>
                  <th className="px-4 py-3">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vocabularyEngagement.slice(0, 20).map((row) => (
                  <tr key={row.vocabularyWordId}>
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.chinese}</span>
                      {row.pinyin ? (
                        <span className="ml-2 text-xs text-slate-500">
                          {row.pinyin}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{row.learnedCount}</td>
                    <td className="px-4 py-3">{row.hskLevel || "—"}</td>
                    <td className="px-4 py-3 capitalize">{row.engagement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Content health</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Subtitles"
            value={metrics.subtitleCount}
          />
          <AnalyticsMetricCard
            label="Vocabulary"
            value={metrics.vocabularyCount}
          />
          <AnalyticsMetricCard
            label="Quiz questions"
            value={metrics.quizQuestionCount}
          />
        </div>
        {contentWarnings.length > 0 ? (
          <ul className="mt-3 list-inside list-disc text-sm text-amber-800">
            {contentWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-emerald-700">Content QA OK</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Recent quiz attempts
          </h3>
          {quiz.recentAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No attempts visible.</p>
          ) : (
            <table className="mt-3 min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-2">User</th>
                  <th className="py-1 pr-2">Score</th>
                  <th className="py-1">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quiz.recentAttempts.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-2 font-mono text-xs">
                      {row.userIdShort}
                    </td>
                    <td className="py-2 pr-2">
                      {row.score}/{row.total} ({row.percentage}%)
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {formatWhen(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Recent lesson progress
          </h3>
          {progress.recentProgress.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No progress visible.</p>
          ) : (
            <table className="mt-3 min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-2">User</th>
                  <th className="py-1 pr-2">Status</th>
                  <th className="py-1">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progress.recentProgress.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-2 font-mono text-xs">
                      {row.userId}
                    </td>
                    <td className="py-2 pr-2">
                      {row.status} · {row.progressPercent}%
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {formatWhen(row.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <LessonAnalyticsImprovementSection detail={detail} />

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/lessons/${metrics.lessonId}/edit`}
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Edit lesson
        </Link>
        <Link
          href={lessonPreviewPath(metrics.lessonId, { adminPreview: true })}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Preview lesson
        </Link>
        <Link
          href="/admin/analytics"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Back to analytics
        </Link>
      </div>
    </div>
  );
}
