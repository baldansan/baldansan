import Link from "next/link";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminDashboardMetrics } from "@/lib/supabase/admin-analytics";

type Props = {
  metrics: AdminDashboardMetrics;
};

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

const QUICK_ACTIONS = [
  { href: "/admin/lessons", label: "Хичээлүүд", icon: "📚" },
  { href: "/admin/import", label: "ZIP импорт", icon: "📦" },
  { href: "/admin/bichleg", label: "Бичлэг", icon: "▶" },
  { href: "/admin/analytics", label: "Тайлан", icon: "📈" },
];

export function AdminDashboard({ metrics }: Props) {
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

  return (
    <div className="flex flex-col gap-6">
      <header className="admin-page-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Хяналтын самбар
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Контентын төлөв, сурагчдын идэвх — бүх хичээлийн нэгдсэн зураглал.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="admin-btn-secondary text-sm"
            >
              <span aria-hidden>{action.icon}</span> {action.label}
            </Link>
          ))}
        </div>
      </header>

      <section aria-labelledby="dash-lessons">
        <h2 id="dash-lessons" className="admin-section-title">
          Хичээлийн төлөв
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Нийт хичээл"
            value={formatNumber(lessonStatus.totalLessons)}
            hint="Бүх түвшин"
          />
          <AdminMetricCard
            label="Нийтлэгдсэн"
            value={formatNumber(lessonStatus.availableCount)}
            accent="emerald"
            hint="Сурагчдад нээлттэй"
          />
          <AdminMetricCard
            label="Ноорог"
            value={formatNumber(lessonStatus.draftCount)}
            accent="amber"
            hint="Хараахан нийтлэгдээгүй"
          />
          <AdminMetricCard
            label="Шалгах шаардлагатай"
            value={formatNumber(contentQa.needsReviewCount)}
            accent={contentQa.needsReviewCount > 0 ? "amber" : "emerald"}
            hint="QA анхааруулга"
          />
        </div>
      </section>

      <section aria-labelledby="dash-content">
        <h2 id="dash-content" className="admin-section-title">
          Контентын сан
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Үгсийн сан"
            value={formatNumber(contentTotals.totalVocabularyWords)}
            hint="Бүртгэлтэй үг"
          />
          <AdminMetricCard
            label="Дасгалын асуулт"
            value={formatNumber(contentTotals.totalQuizQuestions)}
          />
          <AdminMetricCard
            label="Хадмал мөр"
            value={formatNumber(contentTotals.totalSubtitleLines)}
          />
          <AdminMetricCard
            label="Нийтлэхэд бэлэн"
            value={formatNumber(contentQa.lessonsReadyToPublish)}
            accent="emerald"
          />
        </div>
      </section>

      <section aria-labelledby="dash-learners">
        <h2 id="dash-learners" className="admin-section-title">
          Сурагчдын идэвх
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Идэвхтэй суралцагч"
            value={formatNumber(learnerProgress.usersWithLessonProgress)}
            hint="Хичээл эхэлсэн"
          />
          <AdminMetricCard
            label="Дуусгасан хичээл"
            value={formatNumber(learnerProgress.completedLessonRows)}
          />
          <AdminMetricCard
            label="Сурсан үг"
            value={formatNumber(learnerProgress.learnedVocabularyRows)}
          />
          <AdminMetricCard
            label="Дасгалын дундаж"
            value={
              learnerProgress.averageQuizPercentage === null
                ? "—"
                : `${Math.round(learnerProgress.averageQuizPercentage)}%`
            }
            accent="emerald"
            hint={`${formatNumber(learnerProgress.quizAttempts)} оролдлого`}
          />
        </div>
        {learnerProgress.limitedByRls ? (
          <p className="mt-2 text-xs text-slate-500">
            Зарим тоо RLS-ийн улмаас зөвхөн өөрийн өгөгдлөөр хязгаарлагдсан
            байж болно.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="dash-media">
        <h2 id="dash-media" className="admin-section-title">
          Медиа бэлэн байдал
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AdminMetricCard
            label="Бэлэн"
            value={formatNumber(media.mediaReadyCount)}
            accent="emerald"
          />
          <AdminMetricCard
            label="Хүлээгдэж буй"
            value={formatNumber(media.mediaPendingCount)}
            accent="amber"
          />
          <AdminMetricCard
            label="Дутуу"
            value={formatNumber(media.mediaMissingCount)}
            accent={media.mediaMissingCount > 0 ? "amber" : "emerald"}
          />
          <AdminMetricCard
            label="Аудиотай"
            value={formatNumber(media.withAudioCount)}
          />
        </div>
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
          <h2 id="dash-recent" className="admin-section-title">
            Сүүлийн дасгалын оролдлого
          </h2>

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
