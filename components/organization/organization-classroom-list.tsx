import Link from "next/link";
import type { Classroom } from "@/lib/classroom/types";

type Props = {
  classrooms: Classroom[];
  organizationId: string;
  canManage?: boolean;
};

export function OrganizationClassroomList({
  classrooms,
  organizationId,
  canManage = false,
}: Props) {
  if (classrooms.length === 0) {
    return <p className="text-sm text-slate-600">No organization classrooms yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {classrooms.map((c) => (
        <li
          key={c.id}
          className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"
        >
          <Link
            href={`/teacher/classes/${c.id}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {c.name}
          </Link>
          <p className="text-xs text-slate-500">
            {c.level ?? "—"} · {c.studentCount ?? 0} students ·{" "}
            {c.assignmentCount ?? 0} assignments · {c.visibility}
          </p>
          {canManage ? (
            <Link
              href={`/teacher/classes/${c.id}/students/import`}
              className="mt-2 inline-block text-xs font-semibold text-emerald-600"
            >
              Import students →
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
