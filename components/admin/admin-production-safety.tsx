import Link from "next/link";
import { ActivityLogList } from "@/components/admin/activity-log-list";
import type { AdminActivityRow, AdminActivitySummary } from "@/lib/admin/admin-activity-shared";
import type { AdminTask } from "@/lib/admin/task-generator";

type Props = {
  adminActivitySummary: AdminActivitySummary;
  recentAdminActivity: AdminActivityRow[];
  criticalTasks: AdminTask[];
  releaseMigrationPending?: boolean;
  activityWarnings?: string[];
};

export function AdminProductionSafety({
  adminActivitySummary,
  recentAdminActivity,
  criticalTasks,
  releaseMigrationPending = false,
  activityWarnings = [],
}: Props) {
  const checks = [
    {
      label: "Админы RLS дүрмүүд",
      detail: "002_admin_content_policies + admin_profiles",
      status: "needs check" as const,
      href: "/admin/final-audit",
    },
    {
      label: "Медиа хадгалах сан (lesson-media)",
      detail: "Supabase Storage-ийн дүрмүүд тохируулсан",
      status: "needs check" as const,
      href: "/admin/final-audit",
    },
    {
      label: "Үйлдлийн бүртгэл",
      detail:
        activityWarnings.length > 0
          ? activityWarnings[0]
          : `${adminActivitySummary.total} бүртгэгдсэн үйлдэл`,
      status: activityWarnings.length > 0 ? ("needs check" as const) : ("ready" as const),
      href: "/admin/activity",
    },
    {
      label: "Админы ажлын хүснэгт",
      detail: "006_admin_tasks migration",
      status: "ready" as const,
      href: "/admin/tasks",
    },
    {
      label: "Хувилбар гаргах урсгал",
      detail: releaseMigrationPending
        ? "005_lesson_release_workflow migration-ийг ажиллуулна"
        : "Хувилбарын багана бэлэн",
      status: releaseMigrationPending ? ("needs check" as const) : ("ready" as const),
      href: "/admin/final-audit",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {checks.map((item) => (
          <li
            key={item.label}
            className="rounded-xl bg-white p-4 ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                  item.status === "ready"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-amber-50 text-amber-900 ring-amber-200"
                }`}
              >
                {item.status}
              </span>
            </div>
            <Link
              href={item.href}
              className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Нээх →
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Сүүлийн үйлдлүүд
          </h3>
          {recentAdminActivity.length > 0 ? (
            <div className="mt-3">
              <ActivityLogList rows={recentAdminActivity.slice(0, 3)} compact />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Одоогоор бүртгэгдсэн үйлдэл алга.</p>
          )}
          <Link
            href="/admin/activity"
            className="mt-3 inline-block text-xs font-semibold text-emerald-700"
          >
            Бүх үйлдлийн бүртгэл →
          </Link>
        </section>

        <section className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Шийдэгдээгүй ноцтой ажлууд
          </h3>
          {criticalTasks.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {criticalTasks.map((task) => (
                <li key={task.taskKey} className="rounded-lg bg-amber-50/60 px-3 py-2">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  {task.lessonId ? (
                    <p className="text-xs text-slate-600">{task.lessonId}-р хичээл</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Ноцтой ажил алга.</p>
          )}
          <Link
            href="/admin/tasks"
            className="mt-3 inline-block text-xs font-semibold text-emerald-700"
          >
            Ажлын төв →
          </Link>
        </section>
      </div>
    </div>
  );
}
