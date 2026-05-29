import Link from "next/link";
import { TaskCard } from "@/components/admin/task-card";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminTask, AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  summary: AdminTaskSummary;
  urgentTasks: AdminTask[];
};

export function AdminTaskCenterPreview({ summary, urgentTasks }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Task center</h2>
          <p className="mt-1 text-sm text-slate-600">
            Content review queue — generated from live lesson and analytics data.
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Open task center
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
      </div>

      <AdminCard
        title="Task center"
        description={`${summary.totalTasks} tasks · ${summary.criticalCount} critical · ${summary.warningCount} warnings`}
        href="/admin/tasks"
      />

      {urgentTasks.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Top urgent tasks
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {urgentTasks.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-emerald-800">
          No critical or warning tasks — queue looks healthy.
        </p>
      )}
    </section>
  );
}
