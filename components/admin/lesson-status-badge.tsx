import {
  adminStatusLabel,
  toAdminContentStatus,
  type AdminContentStatus,
} from "@/lib/admin/lesson-status";
import type { LessonContentStatus } from "@/types/lesson-content";

type Props = {
  status: LessonContentStatus | string | AdminContentStatus;
};

const tone: Record<AdminContentStatus, string> = {
  draft: "bg-amber-50 text-amber-800 ring-amber-200",
  available: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  archived: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function LessonStatusBadge({ status }: Props) {
  const normalized = toAdminContentStatus(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tone[normalized]}`}
    >
      {adminStatusLabel(normalized)}
      {status === "locked" ? " (locked)" : null}
    </span>
  );
}
