import type { LessonQaStatus } from "@/lib/admin/lesson-qa";

type Props = {
  status: LessonQaStatus;
};

const tone: Record<LessonQaStatus, string> = {
  complete: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  needs_review: "bg-amber-50 text-amber-900 ring-amber-200",
};

const label: Record<LessonQaStatus, string> = {
  complete: "Complete",
  needs_review: "Needs review",
};

export function LessonQaBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tone[status]}`}
    >
      {label[status]}
    </span>
  );
}
