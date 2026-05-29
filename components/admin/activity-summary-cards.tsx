import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminActivitySummary } from "@/lib/admin/admin-activity-shared";

type Props = {
  summary: AdminActivitySummary;
};

export function ActivitySummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <AdminMetricCard label="Total activity" value={summary.total} />
      <AdminMetricCard label="Today" value={summary.today} accent="emerald" />
      <AdminMetricCard label="Lesson actions" value={summary.lessonActions} />
      <AdminMetricCard label="Content actions" value={summary.contentActions} />
      <AdminMetricCard
        label="Publish/release"
        value={summary.publishReleaseActions}
        accent="amber"
      />
      <AdminMetricCard label="Task actions" value={summary.taskActions} />
    </div>
  );
}
