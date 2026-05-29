import type {
  LessonReleaseStatus,
  LessonWorkflowQaStatus,
} from "@/types/lesson-content";

const releaseStyles: Record<LessonReleaseStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  in_review: "bg-sky-50 text-sky-800 ring-sky-200",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  published: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  archived: "bg-amber-50 text-amber-900 ring-amber-200",
};

const qaStyles: Record<LessonWorkflowQaStatus, string> = {
  needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
  passed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  failed: "bg-red-50 text-red-800 ring-red-200",
};

export function ReleaseStatusBadge({
  status = "draft",
}: {
  status?: LessonReleaseStatus | string;
}) {
  const key = (status in releaseStyles ? status : "draft") as LessonReleaseStatus;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${releaseStyles[key]}`}
    >
      {key.replace("_", " ")}
    </span>
  );
}

export function WorkflowQaBadge({
  status = "needs_review",
}: {
  status?: LessonWorkflowQaStatus | string;
}) {
  const key = (status in qaStyles ? status : "needs_review") as LessonWorkflowQaStatus;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${qaStyles[key]}`}
    >
      QA {key.replace("_", " ")}
    </span>
  );
}
