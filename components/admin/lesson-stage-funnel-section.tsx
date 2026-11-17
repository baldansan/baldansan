import type { LessonStageFunnel } from "@/lib/supabase/lesson-stage-funnel";

export function LessonStageFunnelSection({ data }: { data: LessonStageFunnel }) {
  const max = Math.max(1, data.opened);
  const pct = (n: number) => Math.round((n / max) * 100);
  const rows = [
    { label: "Хичээл нээсэн", count: data.opened },
    ...data.byStage.map((s, i) => ({ label: `${i + 1}-р үе · ${s.label} дуусгасан`, count: s.count })),
    { label: "Хичээлийг бүтнээр дуусгасан", count: data.completed },
  ];
  return (
    <section className="admin-panel p-5 sm:p-6">
      <h2 className="admin-section-title">Хичээлийн аль үе дээр зогсож байна вэ</h2>
      <p className="admin-section-desc">
        Нээсэн хичээл бүрийг (хүн × хичээл) тоолов. {data.learners} хүн нийт {data.opened} хичээл нээсэн,
        үүнээс {data.noStage} нь нэг ч үе дуусгаагүй гарсан.
      </p>
      {data.warnings.length > 0 ? (
        <p className="mt-2 text-sm text-amber-800">{data.warnings.join(" ")}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            <span className="w-64 shrink-0 text-slate-700">{row.label}</span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-emerald-500"
                style={{ width: `${pct(row.count)}%` }}
              />
            </span>
            <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-slate-900">
              {row.count} · {pct(row.count)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
