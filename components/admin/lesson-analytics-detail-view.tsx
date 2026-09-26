import Link from "next/link";
import { LessonAnalyticsImprovementSection } from "@/components/admin/lesson-analytics-improvement-section";
import { AnalyticsMetricCard } from "@/components/admin/analytics-metric-card";
import { LessonQaBadge } from "@/components/admin/lesson-qa-badge";
import { MediaStatusBadge } from "@/components/admin/media-status-badge";
import { LessonStatusBadge } from "@/components/admin/lesson-status-badge";
import { lessonPreviewPath } from "@/lib/lesson-publish";
import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type { LessonAnalyticsDetail } from "@/lib/supabase/admin-analytics";
import type { AdminContentStatus } from "@/lib/admin/lesson-status";

type Props = {
  detail: LessonAnalyticsDetail;
};

/** Display-only labels. Keys stay as the raw engagement values. */
const ENGAGEMENT_LABEL: Record<string, string> = {
  high: "Өндөр",
  medium: "Дунд",
  low: "Бага",
  none: "Алга",
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return formatMongoliaDateTimeWithLabel(iso) || iso;
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
        <p className="text-sm font-medium text-emerald-700">Хичээлийн тайлан</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl" translate="no">
          {metrics.title}
        </h1>
        <p className="mt-1 text-lg text-slate-600" translate="no">{metrics.chineseTitle}</p>
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
          <p className="font-semibold">Тайлангийн анхааруулга</p>
          <ul className="mt-2 list-inside list-disc">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Ахиц</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Эхэлсэн хүн"
            value={progress.startedCount}
          />
          <AnalyticsMetricCard
            label="Дуусгасан"
            value={progress.completedCount}
          />
          <AnalyticsMetricCard
            label="Дуусгасан хувь"
            value={formatRate(progress.completionRate)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Дасгалын үзүүлэлт
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <AnalyticsMetricCard label="Оролдлого" value={quiz.attemptCount} />
          <AnalyticsMetricCard
            label="Дундаж оноо"
            value={formatRate(quiz.averagePercentage)}
          />
          <AnalyticsMetricCard
            label="Хамгийн өндөр оноо"
            value={formatRate(quiz.bestPercentage)}
          />
          <AnalyticsMetricCard
            label="Сүүлийн оролдлого"
            value={formatWhen(quiz.latestAttemptAt)}
            hint="Хамгийн сүүлийн дасгал"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Үгсийн сан</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Нийт үг"
            value={vocabulary.totalWords}
          />
          <AnalyticsMetricCard
            label="Сурсан бүртгэл"
            value={vocabulary.learnedRows}
          />
          <AnalyticsMetricCard
            label="Давхардалгүй сурсан үг"
            value={vocabulary.uniqueLearnedWords}
          />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Асуултын үзүүлэлт
          </h2>
          <Link
            href={`/admin/analytics/questions?lesson=${metrics.lessonId}`}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Бүх асуултын дүн шинжилгээ →
          </Link>
        </div>
        {!hasDetailedQuizAnswers ? (
          <p className="mt-3 text-sm text-slate-500">
            Асуулт тус бүрийн дүн шинжилгээ нь дасгалын оролдлогод дэлгэрэнгүй
            хариулт хадгалагдсаны дараа харагдана. Хуучин оролдлогод дэлгэрэнгүй
            хариулт байхгүй байж болно.
          </p>
        ) : questionPerformance.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Энэ хичээлд асуулт тус бүрийн өгөгдөл хараахан алга.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Асуулт</th>
                  <th className="px-4 py-3">Оролдлого</th>
                  <th className="px-4 py-3">Зөв хариултын хувь</th>
                  <th className="px-4 py-3">Зөв хариулт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questionPerformance.map((row) => (
                  <tr key={row.questionKey}>
                    <td className="max-w-md px-4 py-3" translate="no">{row.question}</td>
                    <td className="px-4 py-3">{row.attemptsCount}</td>
                    <td className="px-4 py-3">
                      {formatRate(row.accuracyPercent)}
                      {row.needsReview ? (
                        <span className="ml-2 text-xs text-amber-700">
                          Шалгах шаардлагатай
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs" translate="no">{row.correctAnswer}</td>
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
            Үгсийн сангийн идэвх
          </h2>
          <Link
            href={`/admin/analytics/vocabulary?lesson=${metrics.lessonId}`}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Бүх үгсийн сангийн дүн шинжилгээ →
          </Link>
        </div>
        {vocabularyEngagement.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Энэ хичээлд үг алга.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Үг</th>
                  <th className="px-4 py-3">Сурсан тоо</th>
                  <th className="px-4 py-3">HSK</th>
                  <th className="px-4 py-3">Идэвх</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vocabularyEngagement.slice(0, 20).map((row) => (
                  <tr key={row.vocabularyWordId}>
                    <td className="px-4 py-3" translate="no">
                      <span className="font-medium">{row.chinese}</span>
                      {row.pinyin ? (
                        <span className="ml-2 text-xs text-slate-500">
                          {row.pinyin}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{row.learnedCount}</td>
                    <td className="px-4 py-3">{row.hskLevel || "—"}</td>
                    <td className="px-4 py-3">
                      {ENGAGEMENT_LABEL[row.engagement] ?? row.engagement}
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
          Контентын байдал
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AnalyticsMetricCard
            label="Хадмал"
            value={metrics.subtitleCount}
          />
          <AnalyticsMetricCard
            label="Үгсийн сан"
            value={metrics.vocabularyCount}
          />
          <AnalyticsMetricCard
            label="Дасгалын асуулт"
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
          <p className="mt-3 text-sm text-emerald-700">Контентын шалгалт хэвийн</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Сүүлийн дасгалын оролдлого
          </h3>
          {quiz.recentAttempts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Оролдлого харагдахгүй байна.</p>
          ) : (
            <table className="mt-3 min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-2">Хэрэглэгч</th>
                  <th className="py-1 pr-2">Оноо</th>
                  <th className="py-1">Хэзээ</th>
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
            Хичээлийн сүүлийн ахиц
          </h3>
          {progress.recentProgress.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Ахиц харагдахгүй байна.</p>
          ) : (
            <table className="mt-3 min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-2">Хэрэглэгч</th>
                  <th className="py-1 pr-2">Төлөв</th>
                  <th className="py-1">Шинэчилсэн</th>
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
          Хичээл засах
        </Link>
        <Link
          href={lessonPreviewPath(metrics.lessonId, { adminPreview: true })}
          className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Хичээлийг урьдчилж харах
        </Link>
        <Link
          href="/admin/analytics"
          className="inline-flex rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
        >
          Тайлан руу буцах
        </Link>
      </div>
    </div>
  );
}
