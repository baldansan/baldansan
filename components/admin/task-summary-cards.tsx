import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  summary: AdminTaskSummary;
};

export function TaskSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <AdminMetricCard label="Open" value={summary.openCount} />
      <AdminMetricCard
        label="In progress"
        value={summary.inProgressCount}
        accent="emerald"
      />
      <AdminMetricCard
        label="Overdue"
        value={summary.overdueCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Urgent"
        value={summary.urgentCount}
        accent="amber"
      />
      <AdminMetricCard label="Resolved" value={summary.resolvedCount} />
      <AdminMetricCard
        label="Dismissed"
        value={summary.dismissedCount}
        accent="slate"
      />
    </div>
  );
}

export function TaskSummarySecondaryCards({ summary }: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <AdminMetricCard label="Active tasks" value={summary.activeCount} />
      <AdminMetricCard
        label="Critical"
        value={summary.criticalCount}
        accent="amber"
      />
      <AdminMetricCard
        label="Ready to publish"
        value={summary.readyToPublishCount}
        accent="emerald"
      />
      <AdminMetricCard
        label="Media issues"
        value={summary.mediaIssuesCount}
        accent="amber"
      />
    </div>
  );
}
