import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { LessonAnalyticsTable } from "@/components/admin/lesson-analytics-table";
import { ActivityTimeSection } from "@/components/admin/activity-time-section";
import { QuestionAttemptsAnalyticsSection } from "@/components/admin/question-attempts-analytics-section";
import {
  getAnalyticsQuickSummary,
  getLessonAnalyticsOverview,
} from "@/lib/supabase/admin-analytics";
import { getQuestionAttemptsAnalytics } from "@/lib/supabase/question-attempts-analytics";
import { getActivityTimeOverview } from "@/lib/supabase/activity-time-analytics";
import { getClassroomAdminSummary } from "@/lib/supabase/admin-classroom-stats";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning analytics — Admin",
};

export default async function AdminAnalyticsPage() {
  const [
    overview,
    quickSummary,
    classroomSummary,
    attemptAnalytics,
    activityTime,
  ] = await Promise.all([
    getLessonAnalyticsOverview(),
    getAnalyticsQuickSummary(),
    getClassroomAdminSummary(),
    getQuestionAttemptsAnalytics(),
    getActivityTimeOverview(14),
  ]);

  const avgScore =
    overview.averageQuizScore != null
      ? `${overview.averageQuizScore}%`
      : "—";

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Learning Analytics"
        description="Хичээл бүрийн суралцагчийн ахиц, quiz оноо, vocabulary engagement-г харна."
        actions={
          <Link href="/admin/tasks" className="admin-btn-secondary">
            View tasks
          </Link>
        }
      />

      {overview.warnings.length > 0 ? (
        <div className="admin-panel border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Analytics notes</p>
          <ul className="mt-2 list-inside list-disc">
            {overview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="admin-section-title">Overview</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <AnalyticsMetricCard
            label="Total lessons"
            value={overview.totalLessons}
          />
          <AnalyticsMetricCard
            label="Started lessons"
            value={overview.totalStarted}
            hint="Unique learners started"
          />
          <AnalyticsMetricCard
            label="Completed"
            value={overview.totalCompleted}
          />
          <AnalyticsMetricCard
            label="Quiz attempts"
            value={overview.totalQuizAttempts}
          />
          <AnalyticsMetricCard label="Avg quiz score" value={avgScore} />
        </div>
      </section>

      <section className="admin-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-section-title">Task center</h2>
            <p className="admin-section-desc">
              Analytics insights also generate admin tasks (low scores, difficult
              questions, low vocabulary engagement).
            </p>
          </div>
          <Link href="/admin/tasks" className="admin-btn-primary">
            View generated tasks
          </Link>
        </div>
        {quickSummary.difficultQuestionsCount > 0 ||
        quickSummary.wordsNeverLearnedCount > 0 ? (
          <p className="mt-3 text-sm text-amber-800">
            {quickSummary.difficultQuestionsCount > 0
              ? `${quickSummary.difficultQuestionsCount} difficult question(s). `
              : ""}
            {quickSummary.wordsNeverLearnedCount > 0
              ? `${quickSummary.wordsNeverLearnedCount} word(s) never learned. `
              : ""}
            <Link
              href="/admin/tasks"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Open task center →
            </Link>
          </p>
        ) : null}
      </section>

      <ActivityTimeSection data={activityTime} />

      <QuestionAttemptsAnalyticsSection
        totalAttempts={attemptAnalytics.totalAttempts}
        questionStats={attemptAnalytics.questionStats}
        warnings={attemptAnalytics.warnings}
      />

      <section>
        <h2 className="admin-section-title">Deep insights</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/analytics/questions" className="admin-panel block p-5 hover:shadow-md">
            <p className="font-semibold text-slate-900">Question insights</p>
            <p className="mt-1 text-sm text-slate-600">
              Quiz асуулт бүрийн зөв/буруу хариултын үзүүлэлт.
            </p>
            <p className="mt-2 text-xs text-amber-800">
              {quickSummary.difficultQuestionsCount} difficult question(s)
            </p>
          </Link>
          <Link href="/admin/analytics/vocabulary" className="admin-panel block p-5 hover:shadow-md">
            <p className="font-semibold text-slate-900">Vocabulary insights</p>
            <p className="mt-1 text-sm text-slate-600">
              Хамгийн их/бага сурсан үгс, engagement.
            </p>
            <p className="mt-2 text-xs text-amber-800">
              {quickSummary.wordsNeverLearnedCount} word(s) never learned
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="admin-section-title">Per-lesson analytics</h2>
        <div className="mt-4">
          <LessonAnalyticsTable lessons={overview.lessons} />
        </div>
      </section>
    </div>
  );
}
