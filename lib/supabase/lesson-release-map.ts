import type {
  LessonReleaseStatus,
  LessonWorkflowQaStatus,
} from "@/types/lesson-content";

export const LESSON_RELEASE_COLUMN_SELECT =
  "release_status, qa_status, approved_at, approved_by, release_notes, last_reviewed_at";

type ReleaseRow = {
  release_status?: string | null;
  qa_status?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  release_notes?: string | null;
  last_reviewed_at?: string | null;
};

const VALID_RELEASE: LessonReleaseStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
];

const VALID_QA: LessonWorkflowQaStatus[] = [
  "needs_review",
  "passed",
  "failed",
];

export function normalizeReleaseStatus(
  value: string | null | undefined
): LessonReleaseStatus {
  if (value && (VALID_RELEASE as string[]).includes(value)) {
    return value as LessonReleaseStatus;
  }
  return "draft";
}

export function normalizeWorkflowQaStatus(
  value: string | null | undefined
): LessonWorkflowQaStatus {
  if (value && (VALID_QA as string[]).includes(value)) {
    return value as LessonWorkflowQaStatus;
  }
  return "needs_review";
}

export function mapLessonReleaseFields(row: ReleaseRow) {
  return {
    releaseStatus: normalizeReleaseStatus(row.release_status),
    qaStatus: normalizeWorkflowQaStatus(row.qa_status),
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    releaseNotes: row.release_notes ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
  };
}
