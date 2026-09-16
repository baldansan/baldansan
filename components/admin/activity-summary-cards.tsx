import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminActivitySummary } from "@/lib/admin/admin-activity-shared";

type Props = {
  summary: AdminActivitySummary;
};

export function ActivitySummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <AdminMetricCard label="Нийт бүртгэл" value={summary.total} />
      <AdminMetricCard label="Өнөөдөр" value={summary.today} accent="emerald" />
      <AdminMetricCard
        label="Буцаах боломжтой"
        value={summary.rollbackAvailable}
        accent="emerald"
      />
      <AdminMetricCard
        label="Нийтлэлт / хувилбар"
        value={summary.publishReleaseActions}
        accent="amber"
      />
      <AdminMetricCard label="Ажлын үйлдэл" value={summary.taskActions} />
      <AdminMetricCard label="Контентын үйлдэл" value={summary.contentActions} />
    </div>
  );
}
