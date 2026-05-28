import {
  mediaStatusLabel,
  normalizeMediaStatus,
} from "@/lib/lesson-media";
import type { LessonMediaStatus } from "@/types/lesson-content";

type Props = {
  status?: string | null;
};

const tone: Record<LessonMediaStatus, string> = {
  missing: "bg-slate-100 text-slate-600 ring-slate-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

export function MediaStatusBadge({ status }: Props) {
  const normalized = normalizeMediaStatus(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tone[normalized]}`}
    >
      {mediaStatusLabel(status)}
    </span>
  );
}
