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
          <h2 className="text-lg font-semibold text-slate-900">Ажлын төв</h2>
          <p className="mt-1 text-sm text-slate-600">
            Системээс үүссэн ажлууд — төлөв, ач холбогдол, дуусах огноо,
            тэмдэглэлтэй.
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          Ажлын төв нээх
        </Link>
      </div>

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
        <AdminMetricCard label="Идэвхтэй" value={summary.activeCount} />
        <AdminMetricCard
          label="Шийдэгдсэн"
          value={summary.resolvedCount}
          accent="slate"
        />
      </div>

      <AdminCard
        title="Ажлын төв"
        description={`Идэвхтэй ${summary.activeCount} · хугацаа хэтэрсэн ${summary.overdueCount} · яаралтай ${summary.urgentCount}`}
        href="/admin/tasks"
      />

      {activeTasks.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Хамгийн чухал ажлууд
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
          Идэвхтэй ажил алга — бүх зүйл хэвийн.
        </p>
      )}
    </section>
  );
}
