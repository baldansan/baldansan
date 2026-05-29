import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  summary: AdminTaskSummary;
};

export function TaskSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <AdminMetricCard label="Total tasks" value={summary.totalTasks} />
      <AdminMetricCard
        label="Critical"
        value={summary.criticalCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Warnings"
        value={summary.warningCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Ready to publish"
        value={summary.readyToPublishCount}
        accent="emerald"
      />
      <AdminMetricCard
        label="Needs content"
        value={summary.needsContentCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Media issues"
        value={summary.mediaIssuesCount}
        accent="amber"
      />
    </div>
  );
}
