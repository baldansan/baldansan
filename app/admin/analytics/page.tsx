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
  title: "Суралцахуйн тайлан — Удирдлагын хэсэг",
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
        title="Суралцахуйн тайлан"
        description="Хичээл бүрийн суралцагчийн ахиц, дасгалын оноо, үгсийн сангийн ашиглалтыг харна."
        actions={
          <Link href="/admin/tasks" className="admin-btn-secondary">
            Ажлууд харах
          </Link>
        }
      />

      {overview.warnings.length > 0 ? (
        <div className="admin-panel border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Тайлангийн тэмдэглэл</p>
          <ul className="mt-2 list-inside list-disc">
            {overview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="admin-section-title">Ерөнхий байдал</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <AnalyticsMetricCard
            label="Нийт хичээл"
            value={overview.totalLessons}
          />
          <AnalyticsMetricCard
            label="Эхэлсэн хичээл"
            value={overview.totalStarted}
            hint="Эхэлсэн суралцагчийн тоо"
          />
          <AnalyticsMetricCard
            label="Дууссан"
            value={overview.totalCompleted}
          />
          <AnalyticsMetricCard
            label="Дасгалын оролдлого"
            value={overview.totalQuizAttempts}
          />
          <AnalyticsMetricCard label="Дасгалын дундаж оноо" value={avgScore} />
        </div>
      </section>

      <section className="admin-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="admin-section-title">Ажлын төв</h2>
            <p className="admin-section-desc">
              Тайлангийн дүн шинжилгээнээс админд хийх ажил автоматаар үүснэ
              (бага оноо, хүнд асуулт, үгсийн сан бага ашиглагдсан).
            </p>
          </div>
          <Link href="/admin/tasks" className="admin-btn-primary">
            Үүссэн ажлуудыг харах
          </Link>
        </div>
        {quickSummary.difficultQuestionsCount > 0 ||
        quickSummary.wordsNeverLearnedCount > 0 ? (
          <p className="mt-3 text-sm text-amber-800">
            {quickSummary.difficultQuestionsCount > 0
              ? `Хүнд асуулт ${quickSummary.difficultQuestionsCount}. `
              : ""}
            {quickSummary.wordsNeverLearnedCount > 0
              ? `Сураагүй үг ${quickSummary.wordsNeverLearnedCount}. `
              : ""}
            <Link
              href="/admin/tasks"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Ажлын төв нээх →
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
        <h2 className="admin-section-title">Дэлгэрэнгүй дүн шинжилгээ</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link href="/admin/analytics/questions" className="admin-panel block p-5 hover:shadow-md">
            <p className="font-semibold text-slate-900">Асуултын дүн шинжилгээ</p>
            <p className="mt-1 text-sm text-slate-600">
              Дасгалын асуулт бүрийн зөв, буруу хариултын үзүүлэлт.
            </p>
            <p className="mt-2 text-xs text-amber-800">
              Хүнд асуулт {quickSummary.difficultQuestionsCount}
            </p>
          </Link>
          <Link href="/admin/analytics/vocabulary" className="admin-panel block p-5 hover:shadow-md">
            <p className="font-semibold text-slate-900">Үгсийн сангийн дүн шинжилгээ</p>
            <p className="mt-1 text-sm text-slate-600">
              Хамгийн их, хамгийн бага сурсан үгс болон ашиглалт.
            </p>
            <p className="mt-2 text-xs text-amber-800">
              Сураагүй үг {quickSummary.wordsNeverLearnedCount}
            </p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="admin-section-title">Хичээл тус бүрийн тайлан</h2>
        <div className="mt-4">
          <LessonAnalyticsTable lessons={overview.lessons} />
        </div>
      </section>
    </div>
  );
}
