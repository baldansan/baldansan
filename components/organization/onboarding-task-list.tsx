import Link from "next/link";
import type { OrganizationOnboardingTask, OnboardingTaskStatus } from "@/lib/b2b/types";

const STATUS_COLORS: Record<OnboardingTaskStatus, string> = {
  open: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  skipped: "bg-amber-100 text-amber-800",
};

const TASK_LINKS: Record<string, (orgId: string) => string> = {
  organization_profile_complete: (id) => `/organization/${id}`,
  add_owner_or_manager: (id) => `/organization/${id}/members`,
  add_first_teacher: (id) => `/organization/${id}/members`,
  create_first_classroom: (id) => `/teacher/classes/new?organizationId=${id}`,
  add_demo_students: (id) => `/organization/${id}/classrooms`,
  create_first_assignment: (id) => `/teacher/assignments/new?organizationId=${id}`,
  test_student_assignment: () => `/my-assignments`,
  review_teacher_report: (id) => `/organization/${id}/reports`,
  export_pilot_plan: (id) => `/organization/${id}/setup`,
  mark_ready_for_pilot: (id) => `/organization/${id}/setup`,
};

type Props = {
  organizationId: string;
  tasks: OrganizationOnboardingTask[];
  canManage: boolean;
  onStatusChange: (taskId: string, status: OnboardingTaskStatus) => void;
  saving?: boolean;
};

export function OnboardingTaskList({
  organizationId,
  tasks,
  canManage,
  onStatusChange,
  saving = false,
}: Props) {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-600">No onboarding tasks yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => {
        const link = TASK_LINKS[task.taskKey]?.(organizationId);
        return (
          <li
            key={task.id}
            className="rounded-xl bg-white p-4 ring-1 ring-slate-200"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-slate-900">{task.title}</h3>
                {task.description ? (
                  <p className="mt-1 text-xs text-slate-500">{task.description}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[task.status]}`}
                >
                  {task.status}
                </span>
                <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                  {task.category}
                </span>
              </div>
            </div>
            {task.dueDate ? (
              <p className="mt-1 text-xs text-slate-500">Due: {task.dueDate}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {link ? (
                <Link
                  href={link}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                >
                  Open step →
                </Link>
              ) : null}
              {canManage ? (
                <>
                  {task.status !== "in_progress" && task.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatusChange(task.id, "in_progress")}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Start
                    </button>
                  ) : null}
                  {task.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatusChange(task.id, "completed")}
                      className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Complete
                    </button>
                  ) : null}
                  {task.status !== "skipped" && task.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatusChange(task.id, "skipped")}
                      className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800"
                    >
                      Skip
                    </button>
                  ) : null}
                  {task.status === "completed" || task.status === "skipped" ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onStatusChange(task.id, "open")}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Reopen
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
