import Link from "next/link";
import { TaskCardWithActions } from "@/components/admin/task-card-with-actions";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import type { AdminTask, AdminTaskSummary } from "@/lib/admin/task-generator";

type Props = {
  summary: AdminTaskSummary;
  activeTasks: AdminTask[];
};

export function AdminTaskCenterPreview({ summary, activeTasks }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Task center</h2>
          <p className="mt-1 text-sm text-slate-600">
            Generated tasks with persistent status, priority, due dates, and
            notes.
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Open task center
        </Link>
      </div>

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
        <AdminMetricCard label="Active" value={summary.activeCount} />
        <AdminMetricCard
          label="Resolved"
          value={summary.resolvedCount}
          accent="slate"
        />
      </div>

      <AdminCard
        title="Task center"
        description={`${summary.activeCount} active · ${summary.overdueCount} overdue · ${summary.urgentCount} urgent`}
        href="/admin/tasks"
      />

      {activeTasks.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Top active tasks
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {activeTasks.map((task) => (
              <li key={task.taskKey}>
                <TaskCardWithActions task={task} compact />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-emerald-800">
          No active tasks — queue looks healthy.
        </p>
      )}
    </section>
  );
}
