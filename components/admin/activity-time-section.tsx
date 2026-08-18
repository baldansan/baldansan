import type {
  ActivitySurfaceKey,
  ActivityTimeOverview,
} from "@/lib/supabase/activity-time-analytics";
import { ACTIVITY_SURFACES } from "@/lib/supabase/activity-time-analytics";

const SURFACE_LABEL: Record<ActivitySurfaceKey, string> = {
  lesson: "Хичээл",
  video: "Бичлэг",
  game: "Тоглоом",
  writing: "Бичих",
  review: "Давталт",
  mock: "Мок шалгалт",
};

export function ActivityTimeSection({ data }: { data: ActivityTimeOverview }) {
  return (
    <section className="admin-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="admin-section-title">Идэвхийн цаг</h2>
          <p className="admin-section-desc">
            Сүүлийн {data.windowDays} өдөр: суралцагчдын гадаргуу бүр дээр
            зарцуулсан нийт минут (user_activity_sessions).
          </p>
        </div>
        <p className="text-sm text-slate-600">
          Нийт <span className="font-semibold">{data.totalMinutes}</span> мин ·{" "}
          <span className="font-semibold">{data.totalLearners}</span> суралцагч
        </p>
      </div>

      {data.warnings.length > 0 ? (
        <ul className="mt-3 list-inside list-disc text-sm text-amber-800">
          {data.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {data.days.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Одоогоор бүртгэгдсэн идэвх алга. Суралцагчид нэвтэрч хичээл/тоглоом
          ашиглахад мөрүүд гарч ирнэ.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Өдөр</th>
                {ACTIVITY_SURFACES.map((s) => (
                  <th key={s} className="py-2 pr-3 text-right">
                    {SURFACE_LABEL[s]}
                  </th>
                ))}
                <th className="py-2 pr-3 text-right">Нийт мин</th>
                <th className="py-2 text-right">Суралцагч</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((row) => (
                <tr key={row.day} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-800">{row.day}</td>
                  {ACTIVITY_SURFACES.map((s) => (
                    <td key={s} className="py-2 pr-3 text-right tabular-nums text-slate-700">
                      {row.minutesBySurface[s] || "·"}
                    </td>
                  ))}
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums text-slate-900">
                    {row.totalMinutes}
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-700">
                    {row.learners}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
