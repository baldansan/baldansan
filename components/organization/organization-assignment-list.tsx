import Link from "next/link";
import type { Assignment } from "@/lib/classroom/types";

type Props = {
  assignments: Assignment[];
};

export function OrganizationAssignmentList({ assignments }: Props) {
  if (assignments.length === 0) {
    return <p className="text-sm text-slate-600">No organization assignments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((a) => (
        <li
          key={a.id}
          className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
        >
          <Link
            href={`/teacher/assignments/${a.id}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {a.title}
          </Link>
          <p className="text-xs text-slate-500">
            {a.classroomName ?? "—"} · Lesson {a.lessonId}
            {a.dueDate ? ` · Due ${a.dueDate}` : ""} · {a.status}
          </p>
        </li>
      ))}
    </ul>
  );
}
