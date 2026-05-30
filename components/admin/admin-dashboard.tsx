import { AdminCollapsibleSection } from "@/components/admin/admin-editor-ui";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminDashboardMetrics } from "@/lib/supabase/admin-analytics";

type Props = {
  metrics: AdminDashboardMetrics;
};

export function AdminDashboard({ metrics }: Props) {
  const needsReview = metrics.contentQa.needsReviewCount;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminMetricCard
          label="Нийт хичээл"
          value={metrics.lessonStatus.totalLessons}
        />
        <AdminMetricCard
          label="Ноорог"
          value={metrics.lessonStatus.draftCount}
          accent="amber"
        />
        <AdminMetricCard
          label="Нийтлэгдсэн"
          value={metrics.lessonStatus.availableCount}
          accent="emerald"
        />
        <AdminMetricCard
          label="Шалгах шаардлагатай"
          value={needsReview}
          accent="amber"
        />
      </div>
    </div>
  );
}
