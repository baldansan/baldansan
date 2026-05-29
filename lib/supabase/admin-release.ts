import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_ACTIVITY_ACTIONS,
  buildShallowDiffSummary,
  logAdminActivityFireAndForget,
} from "@/lib/supabase/admin-activity";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  normalizeReleaseStatus,
  normalizeWorkflowQaStatus,
} from "@/lib/supabase/lesson-release-map";
import type {
  LessonReleaseStatus,
  LessonWorkflowQaStatus,
} from "@/types/lesson-content";

export type AdminReleaseResult<T> = {
  data: T | null;
  error: string | null;
};

const RLS_HINT =
  "Admin RLS policy шаардлагатай — supabase/policies/002_admin_content_policies.sql";

function notConfigured<T>(): AdminReleaseResult<T> {
  return {
    data: null,
    error:
      "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
  };
}

function formatWriteError(error: { code?: string; message: string }): string {
  const message = error.message ?? "";
  if (
    error.code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("row-level security")
  ) {
    return `${RLS_HINT} (${message})`;
  }
  return message || "Хадгалахад алдаа гарлаа.";
}

async function requireAdmin(): Promise<AdminReleaseResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function getSessionUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

type ReleaseSnapshotRow = {
  status?: string | null;
  release_status?: string | null;
  qa_status?: string | null;
  release_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
};

async function fetchReleaseSnapshot(
  lessonId: string
): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("lessons")
      .select(
        "status, release_status, qa_status, release_notes, approved_at, approved_by"
      )
      .eq("id", lessonId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as ReleaseSnapshotRow;
    return {
      status: row.status ?? null,
      releaseStatus: row.release_status ?? null,
      qaStatus: row.qa_status ?? null,
      releaseNotes: row.release_notes ?? null,
      approvedAt: row.approved_at ?? null,
      approvedBy: row.approved_by ?? null,
    };
  } catch {
    return null;
  }
}

export async function updateLessonReleaseStatus(
  lessonId: string,
  releaseStatus: LessonReleaseStatus
): Promise<AdminReleaseResult<{ id: string; releaseStatus: LessonReleaseStatus }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const beforeSnapshot = await fetchReleaseSnapshot(lessonId);
  const afterSnapshot = {
    ...(beforeSnapshot ?? {}),
    releaseStatus,
  };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({ release_status: releaseStatus })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.releaseStatusUpdated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} release status → ${releaseStatus}`,
      metadata: { releaseStatus },
      beforeSnapshot: beforeSnapshot ?? undefined,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });
    return { data: { id: lessonId, releaseStatus }, error: null };
  } catch {
    return { data: null, error: "Release status шинэчлэхэд алдаа гарлаа." };
  }
}

export async function updateLessonQaStatus(
  lessonId: string,
  qaStatus: LessonWorkflowQaStatus
): Promise<AdminReleaseResult<{ id: string; qaStatus: LessonWorkflowQaStatus }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const beforeSnapshot = await fetchReleaseSnapshot(lessonId);
  const afterSnapshot = {
    ...(beforeSnapshot ?? {}),
    qaStatus,
    lastReviewedAt: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        qa_status: qaStatus,
        last_reviewed_at: afterSnapshot.lastReviewedAt,
      })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.qaStatusUpdated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} QA status → ${qaStatus}`,
      metadata: { qaStatus },
      beforeSnapshot: beforeSnapshot ?? undefined,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });
    return { data: { id: lessonId, qaStatus }, error: null };
  } catch {
    return { data: null, error: "QA status шинэчлэхэд алдаа гарлаа." };
  }
}

export async function approveLessonForPublish(
  lessonId: string,
  userId: string,
  releaseNotes?: string
): Promise<
  AdminReleaseResult<{
    id: string;
    releaseStatus: LessonReleaseStatus;
    qaStatus: LessonWorkflowQaStatus;
  }>
> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const writeUserId = (await getSessionUserId()) ?? userId;
  const now = new Date().toISOString();
  const beforeSnapshot = await fetchReleaseSnapshot(lessonId);

  try {
    const payload: Record<string, unknown> = {
      release_status: "approved",
      qa_status: "passed",
      approved_at: now,
      approved_by: writeUserId,
      last_reviewed_at: now,
    };
    if (releaseNotes !== undefined) {
      payload.release_notes = releaseNotes;
    }

    const { error } = await supabase
      .from("lessons")
      .update(payload)
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };

    const afterSnapshot = {
      ...(beforeSnapshot ?? {}),
      releaseStatus: "approved",
      qaStatus: "passed",
      approvedAt: now,
      approvedBy: writeUserId,
      releaseNotes: releaseNotes ?? beforeSnapshot?.releaseNotes ?? null,
    };

    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.lessonApproved,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} approved for publish`,
      metadata: { releaseNotes: releaseNotes ?? null },
      beforeSnapshot: beforeSnapshot ?? undefined,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });
    return {
      data: {
        id: lessonId,
        releaseStatus: "approved",
        qaStatus: "passed",
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Approve хийхэд алдаа гарлаа." };
  }
}

export async function markLessonReviewed(
  lessonId: string
): Promise<AdminReleaseResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        release_status: "in_review",
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Review тэмдэглэхэд алдаа гарлаа." };
  }
}

export async function updateLessonReleaseNotes(
  lessonId: string,
  releaseNotes: string
): Promise<AdminReleaseResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const beforeSnapshot = await fetchReleaseSnapshot(lessonId);
  const afterSnapshot = {
    ...(beforeSnapshot ?? {}),
    releaseNotes,
  };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({ release_notes: releaseNotes })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    logAdminActivityFireAndForget({
      action: ADMIN_ACTIVITY_ACTIONS.releaseNotesUpdated,
      entityType: "lesson",
      entityId: lessonId,
      lessonId,
      title: `Lesson ${lessonId} release notes updated`,
      beforeSnapshot: beforeSnapshot ?? undefined,
      afterSnapshot,
      diffSummary: buildShallowDiffSummary(beforeSnapshot, afterSnapshot),
    });
    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Release notes хадгалахад алдаа гарлаа." };
  }
}

/** After public publish — sync internal release_status. */
export async function syncReleaseOnPublish(
  lessonId: string
): Promise<AdminReleaseResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({ release_status: "published" })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Release sync алдаа." };
  }
}

/** After unpublish to draft — reset release workflow fields lightly. */
export async function syncReleaseOnUnpublish(
  lessonId: string
): Promise<AdminReleaseResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  try {
    const { error } = await supabase
      .from("lessons")
      .update({
        release_status: "in_review",
        qa_status: "needs_review",
      })
      .eq("id", lessonId);

    if (error) return { data: null, error: formatWriteError(error) };
    return { data: { id: lessonId }, error: null };
  } catch {
    return { data: null, error: "Release sync алдаа." };
  }
}

export {
  normalizeReleaseStatus,
  normalizeWorkflowQaStatus,
};
