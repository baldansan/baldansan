import Link from "next/link";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { LessonAnalyticsTable } from "@/components/admin/lesson-analytics-table";
import {
  getAnalyticsQuickSummary,
  getLessonAnalyticsOverview,
} from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning analytics — Admin",
};

export default async function AdminAnalyticsPage() {
  const [overview, quickSummary] = await Promise.all([
    getLessonAnalyticsOverview(),
    getAnalyticsQuickSummary(),
  ]);

  const avgScore =
    overview.averageQuizScore != null
      ? `${overview.averageQuizScore}%`
      : "—";

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Learning analytics
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Хичээл бүрийн суралцагчийн ахиц, quiz оноо, vocabulary
          engagement-г харна.
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

      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
        <p className="font-semibold">Learner engagement (Phase 7 Step 5)</p>
        <p className="mt-1">
          In-app reminders, notifications, achievements, weekly reports, and study
          plan are live for learners. Admin management for user reminders is not
          included yet.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
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

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Task center
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Analytics insights also generate admin tasks (low scores, difficult
              questions, low vocabulary engagement).
            </p>
          </div>
          <Link
            href="/admin/tasks"
            className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
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

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Deep insights</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/analytics/questions"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-emerald-200"
          >
            <p className="font-semibold text-slate-900">Question insights</p>
            <p className="mt-1 text-sm text-slate-600">
              Quiz асуулт бүрийн зөв/буруу хариултын үзүүлэлт.
            </p>
            <p className="mt-2 text-xs text-amber-800">
              {quickSummary.difficultQuestionsCount} difficult question(s)
            </p>
          </Link>
          <Link
            href="/admin/analytics/vocabulary"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-colors hover:ring-emerald-200"
          >
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
        <h2 className="text-lg font-semibold text-slate-900">
          Per-lesson analytics
        </h2>
        <div className="mt-4">
          <LessonAnalyticsTable lessons={overview.lessons} />
        </div>
      </section>
    </div>
  );
}
