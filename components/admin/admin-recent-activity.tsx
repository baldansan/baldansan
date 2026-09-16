import { formatMongoliaDateTimeWithLabel } from "@/lib/datetime/mongolia-time";
import type {
  RecentLessonProgressRow,
  RecentQuizAttemptRow,
} from "@/lib/supabase/admin-analytics";

type Props = {
  quizAttempts: RecentQuizAttemptRow[];
  lessonProgress: RecentLessonProgressRow[];
};

function formatWhen(iso: string): string {
  if (!iso) return "—";
  return formatMongoliaDateTimeWithLabel(iso) || iso;
}

export function AdminRecentActivity({
  quizAttempts,
  lessonProgress,
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Сүүлийн дасгалын оролдлого
        </h3>
        {quizAttempts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Дасгалын оролдлого харагдахгүй байна (RLS-ээс болж зөвхөн өөрийн мөрүүд харагдаж болно).
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Хичээл</th>
                  <th className="py-2 pr-3">Оноо</th>
                  <th className="py-2">Хэзээ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quizAttempts.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {row.lessonId}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {row.score}/{row.total} ({row.percentage}%)
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {formatWhen(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">
          Хичээлийн сүүлийн ахиц
        </h3>
        {lessonProgress.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Ахицын мөр харагдахгүй байна (RLS-ээс болж зөвхөн өөрийн мөрүүд харагдаж болно).
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Хичээл</th>
                  <th className="py-2 pr-3">Төлөв</th>
                  <th className="py-2">Шинэчилсэн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lessonProgress.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {row.lessonId}
                    </td>
                    <td className="py-2 pr-3 text-slate-700">
                      {row.status} · {row.progressPercent}%
                    </td>
                    <td className="py-2 text-xs text-slate-500">
                      {formatWhen(row.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
