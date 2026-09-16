import Link from "next/link";

import { AdminActivityChart } from "@/components/admin/admin-activity-chart";
import {
  AdminAttentionPanel,
  type AttentionItem,
} from "@/components/admin/admin-attention-panel";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { GradeChip } from "@/components/admin/learner-grade-board";
import {
  LEARNER_GRADE_LABELS,
  LEARNER_GRADE_RANGES,
} from "@/lib/learner-grade";
import type { ActivityTimeOverview } from "@/lib/supabase/activity-time-analytics";
import type { LearnerGradeBoard } from "@/lib/supabase/admin-learner-grades";
import type { AdminDashboardMetrics } from "@/lib/supabase/admin-analytics";

type Props = {
  metrics: AdminDashboardMetrics;
  activity: ActivityTimeOverview;
  grades: LearnerGradeBoard | null;
  windowDays: number;
};

const WINDOW_OPTIONS = [
  { days: 7, label: "7 хоног" },
  { days: 30, label: "30 хоног" },
  { days: 90, label: "90 хоног" },
];

const numberFormatter = new Intl.NumberFormat("mn-MN");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("mn-MN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Splits a double-length activity window into "this period" and "the one
 * before it", which is what the change pills on the cards compare.
 */
function splitActivityWindow(
  activity: ActivityTimeOverview,
  windowDays: number
) {
  const days = [...activity.days].sort((a, b) => a.day.localeCompare(b.day));
  const current = days.slice(-windowDays);
  const previous = days.slice(-windowDays * 2, -windowDays);

  const sumMinutes = (rows: typeof days) =>
    rows.reduce((total, row) => total + row.totalMinutes, 0);
  const peakLearners = (rows: typeof days) =>
    rows.reduce((peak, row) => Math.max(peak, row.learners), 0);
  const activeDays = (rows: typeof days) =>
    rows.filter((row) => row.totalMinutes > 0).length;

  return {
    currentDays: current,
    currentMinutes: sumMinutes(current),
    previousMinutes: sumMinutes(previous),
    currentLearners: peakLearners(current),
    previousLearners: peakLearners(previous),
    currentActiveDays: activeDays(current),
    previousActiveDays: activeDays(previous),
    hasPrevious: previous.length > 0,
  };
}

export function AdminDashboard({
  metrics,
  activity,
  grades,
  windowDays,
}: Props) {
  const {
    lessonStatus,
    contentTotals,
    contentQa,
    media,
    learnerProgress,
    needsAttention,
    recentQuizAttempts,
    warnings,
  } = metrics;

  const window = splitActivityWindow(activity, windowDays);
  const comparisonLabel = `өмнөх ${windowDays} хоногтой харьцуулахад`;

  // When the activity table isn't reachable there is no zero to report — a
  // hard 0 would read as "nobody is using the app", which is a different claim.
  const activityAvailable = activity.warnings.length === 0;
  const unavailableLabel = "хэрэглээний хүснэгт идэвхжээгүй";

  const attentionItems: AttentionItem[] = [
    {
      count: lessonStatus.draftCount,
      label: "Ноорог хичээл",
      description: "Бэлэн болмогц нийтлэх шаардлагатай.",
      href: "/admin/lessons",
    },
    {
      count: contentQa.needsReviewCount,
      label: "Шалгах шаардлагатай",
      description: "QA анхааруулгатай хичээлүүд.",
      href: "/admin/lessons",
    },
    {
      count: contentQa.lessonsMissingVocabulary,
      label: "Үгсийн сан дутуу",
      description: "Нэг ч үг бүртгэгдээгүй хичээл.",
      href: "/admin/lessons",
    },
    {
      count: contentQa.lessonsMissingQuiz,
      label: "Дасгал дутуу",
      description: "Асуулт байхгүй хичээл.",
      href: "/admin/lessons",
    },
    {
      count: media.mediaMissingCount,
      label: "Медиа дутуу",
      description: "Аудио эсвэл бичлэг нь дутуу.",
      href: "/admin/lessons",
    },
    {
      count: needsAttention.length,
      label: "Нийт анхааруулга",
      description: "Дэлгэрэнгүйг доорх жагсаалтаас үз.",
      href: "/admin/lessons",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="admin-page-header">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Тавтай морил 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Бөөндөө Сурцгаая — контент болон суралцагчдын нэгдсэн төлөв.
          </p>
        </div>
        <nav aria-label="Хугацааны хүрээ" className="flex flex-wrap gap-1.5">
          {WINDOW_OPTIONS.map((option) => {
            const active = option.days === windowDays;
            return (
              <Link
                key={option.days}
                href={`/admin?days=${option.days}`}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                }
              >
                Сүүлийн {option.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <section aria-label="Гол үзүүлэлт">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminMetricCard
            label="Суралцсан хугацаа"
            value={
              activityAvailable
                ? `${formatNumber(window.currentMinutes)} мин`
                : "—"
            }
            icon="⏱"
            trend={{
              percent:
                activityAvailable && window.hasPrevious
                  ? percentChange(window.currentMinutes, window.previousMinutes)
                  : null,
              label: !activityAvailable
                ? unavailableLabel
                : window.hasPrevious
                  ? comparisonLabel
                  : "харьцуулах өмнөх өгөгдөл алга",
            }}
          />
          <AdminMetricCard
            label="Идэвхтэй суралцагч"
            value={formatNumber(
              Math.max(
                window.currentLearners,
                learnerProgress.usersWithLessonProgress
              )
            )}
            icon="🧑‍🎓"
            trend={{
              percent:
                activityAvailable && window.hasPrevious
                  ? percentChange(
                      window.currentLearners,
                      window.previousLearners
                    )
                  : null,
              label:
                activityAvailable && window.hasPrevious
                  ? comparisonLabel
                  : "хичээл эхлүүлсэн нийт хүн",
            }}
          />
          <AdminMetricCard
            label="Идэвхтэй өдөр"
            value={
              activityAvailable
                ? `${formatNumber(window.currentActiveDays)}/${windowDays}`
                : "—"
            }
            icon="📆"
            trend={{
              percent:
                activityAvailable && window.hasPrevious
                  ? percentChange(
                      window.currentActiveDays,
                      window.previousActiveDays
                    )
                  : null,
              label: !activityAvailable
                ? unavailableLabel
                : window.hasPrevious
                  ? comparisonLabel
                  : "хэрэглээ бүртгэгдсэн өдөр",
            }}
          />
          <AdminMetricCard
            label="Дасгалын дундаж"
            value={
              learnerProgress.averageQuizPercentage === null
                ? "—"
                : `${Math.round(learnerProgress.averageQuizPercentage)}%`
            }
            icon="🎯"
            hint={`${formatNumber(learnerProgress.quizAttempts)} оролдлого`}
          />
        </div>
      </section>

      <AdminAttentionPanel items={attentionItems} />

      <AdminActivityChart
        days={window.currentDays}
        title={`Сүүлийн ${windowDays} хоногийн суралцах хугацаа`}
        emptyMessage={
          activityAvailable
            ? "Энэ хугацаанд бүртгэгдсэн хэрэглээ алга."
            : "Хэрэглээний хэмжилт идэвхжээгүй байна — Supabase дээр 050_learner_activity.sql миграцыг ажиллуулснаар энэ график дүүрнэ."
        }
      />

      <section aria-labelledby="dash-content">
        <h2 id="dash-content" className="admin-section-title">
          Контентын сан
        </h2>
        <p className="admin-section-desc">
          Бүх түвшний хичээл, үг, дасгалын нэгдсэн тоо.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminMetricCard
            label="Нийт хичээл"
            value={formatNumber(lessonStatus.totalLessons)}
            icon="📚"
            hint={`${formatNumber(lessonStatus.availableCount)} нийтлэгдсэн · ${formatNumber(lessonStatus.draftCount)} ноорог`}
          />
          <AdminMetricCard
            label="Үгсийн сан"
            value={formatNumber(contentTotals.totalVocabularyWords)}
            icon="🔤"
            hint="Бүртгэлтэй үг"
          />
          <AdminMetricCard
            label="Дасгалын асуулт"
            value={formatNumber(contentTotals.totalQuizQuestions)}
            icon="❓"
            hint="Бүх түвшин"
          />
          <AdminMetricCard
            label="Нийтлэхэд бэлэн"
            value={formatNumber(contentQa.lessonsReadyToPublish)}
            icon="✅"
            hint={`Медиа бэлэн: ${formatNumber(media.mediaReadyCount)}`}
          />
        </div>
      </section>

      {grades && grades.rows.length > 0 ? (
        <section className="admin-panel p-5" aria-labelledby="dash-grades">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 id="dash-grades" className="admin-section-title">
                Суралцагчдын үнэлгээ
              </h2>
              <p className="admin-section-desc mt-0.5">
                {formatNumber(grades.ratedCount)} суралцагч үнэлэгдсэн
                {grades.averageScore != null
                  ? ` · дундаж ${grades.averageScore} оноо`
                  : ""}
              </p>
            </div>
            <Link
              href="/admin/learners"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Бүтэн жагсаалт →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {grades.distribution.map(({ bucket, count }) => (
              <Link
                key={bucket}
                href="/admin/learners"
                title={LEARNER_GRADE_LABELS[bucket]}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-emerald-200"
              >
                <span className="flex items-center gap-2">
                  <GradeChip bucket={bucket} size="sm" />
                  <span className="text-lg font-bold text-slate-900">
                    {formatNumber(count)}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                  {LEARNER_GRADE_RANGES[bucket]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="dash-learners">
        <h2 id="dash-learners" className="admin-section-title">
          Суралцагчдын үр дүн
        </h2>
        <p className="admin-section-desc">
          Апп дээр бүртгэгдсэн ахиц.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <AdminMetricCard
            label="Хичээл эхэлсэн"
            value={formatNumber(learnerProgress.usersWithLessonProgress)}
            icon="🚀"
            hint="Суралцагчийн тоо"
          />
          <AdminMetricCard
            label="Дуусгасан хичээл"
            value={formatNumber(learnerProgress.completedLessonRows)}
            icon="🏁"
          />
          <AdminMetricCard
            label="Сурсан үг"
            value={formatNumber(learnerProgress.learnedVocabularyRows)}
            icon="🧠"
          />
          <AdminMetricCard
            label="Дасгалын оролдлого"
            value={formatNumber(learnerProgress.quizAttempts)}
            icon="📝"
          />
        </div>
        {learnerProgress.limitedByRls ? (
          <p className="mt-2 text-xs text-slate-500">
            Зарим тоо RLS-ийн улмаас хязгаарлагдсан байж болно.
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="admin-panel p-5" aria-labelledby="dash-attention">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dash-attention" className="admin-section-title">
              Анхаарал шаардсан хичээл
            </h2>
            <Link
              href="/admin/lessons"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Бүгдийг харах →
            </Link>
          </div>

          {needsAttention.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Бүх хичээл шалгалтаа давсан байна. 🎉
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {needsAttention.slice(0, 6).map((item) => (
                <li
                  key={item.lessonId}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2"
                >
                  <Link
                    href={`/admin/lessons/${item.lessonId}`}
                    className="text-sm font-semibold text-slate-800 hover:text-emerald-700"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.issues.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {needsAttention.length > 6 ? (
            <p className="mt-3 text-xs text-slate-500">
              Бусад {formatNumber(needsAttention.length - 6)} хичээл мөн
              жагсаалтад байна.
            </p>
          ) : null}
        </section>

        <section className="admin-panel p-5" aria-labelledby="dash-recent">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dash-recent" className="admin-section-title">
              Сүүлийн дасгалын оролдлого
            </h2>
            <Link
              href="/admin/analytics"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Тайлан →
            </Link>
          </div>

          {recentQuizAttempts.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Одоогоор бүртгэгдсэн оролдлого алга.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-slate-100">
              {recentQuizAttempts.slice(0, 6).map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      Хичээл {attempt.lessonId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(attempt.createdAt)}
                    </p>
                  </div>
                  <span
                    className={
                      attempt.percentage >= 60
                        ? "admin-badge admin-badge-pass"
                        : "admin-badge admin-badge-warn"
                    }
                  >
                    {attempt.score}/{attempt.total} · {attempt.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {warnings.length > 0 ? (
        <section className="admin-panel border-amber-200 bg-amber-50/60 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Системийн анхааруулга
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {warnings.map((warning) => (
              <li key={warning} className="text-xs text-amber-800">
                • {warning}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
