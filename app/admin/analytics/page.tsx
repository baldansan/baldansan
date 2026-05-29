import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { LessonAnalyticsTable } from "@/components/admin/lesson-analytics-table";
import { getLessonAnalyticsOverview } from "@/lib/supabase/admin-analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning analytics — Admin",
};

export default async function AdminAnalyticsPage() {
  const overview = await getLessonAnalyticsOverview();

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
