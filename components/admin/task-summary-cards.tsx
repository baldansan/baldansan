import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  summary: AdminTaskSummary;
};

export function TaskSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <AdminMetricCard label="Нээлттэй" value={summary.openCount} />
      <AdminMetricCard
        label="Хийгдэж байна"
        value={summary.inProgressCount}
        accent="emerald"
      />
      <AdminMetricCard
        label="Хугацаа хэтэрсэн"
        value={summary.overdueCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Яаралтай"
        value={summary.urgentCount}
        accent="amber"
      />
      <AdminMetricCard label="Шийдэгдсэн" value={summary.resolvedCount} />
      <AdminMetricCard
        label="Хаасан"
        value={summary.dismissedCount}
        accent="slate"
      />
    </div>
  );
}

export function TaskSummarySecondaryCards({ summary }: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AdminMetricCard label="Идэвхтэй ажил" value={summary.activeCount} />
      <AdminMetricCard
        label="Ноцтой"
        value={summary.criticalCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Нийтлэхэд бэлэн"
        value={summary.readyToPublishCount}
        accent="emerald"
      />
      <AdminMetricCard
        label="Медиагийн асуудал"
        value={summary.mediaIssuesCount}
        accent="amber"
      />
    </div>
  );
}
