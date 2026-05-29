import {
  activityRollbackAvailable,
  buildDbPatch,
  canRollbackActivity,
  getRollbackKind,
  MEDIA_DB_MAP,
  METADATA_DB_MAP,
  MEDIA_SNAPSHOT_KEYS,
  METADATA_SNAPSHOT_KEYS,
  RELEASE_DB_MAP,
  RELEASE_SNAPSHOT_KEYS,
  STATUS_SNAPSHOT_KEYS,
  type RollbackEligibility,
} from "@/lib/admin/admin-rollback-eligibility";
import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";
import { isCurrentUserAdmin } from "@/lib/supabase/admin";
import {
  getAdminActivityById,
  logAdminActivity,
  ADMIN_ACTIVITY_ACTIONS,
} from "@/lib/supabase/admin-activity";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import {
  canonicalLessonId,
  lessonIdQueryCandidates,
  normalizeLessonRouteId,
} from "@/lib/lesson-id";

export type AdminRollbackResult<T> = {
  data: T | null;
  error: string | null;
};

export type RollbackPreviewResult = RollbackEligibility & {
  activity: AdminActivityRow | null;
  lessonExists: boolean;
};

export type RollbackExecuteResult = {
  lessonId: string;
  restoredFields: string[];
  rollbackActivityId?: string;
};

export { canRollbackActivity, activityRollbackAvailable };

function notConfigured<T>(): AdminRollbackResult<T> {
  return { data: null, error: "Supabase is not configured." };
}

async function requireAdmin(): Promise<AdminRollbackResult<true>> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { data: null, error: "Admin эрх шаардлагатай." };
  }
  return { data: true, error: null };
}

async function lessonExists(lessonId: string): Promise<boolean> {
  if (!supabase) return false;
  const normalizedId = normalizeLessonRouteId(lessonId);
  const candidates = lessonIdQueryCandidates(normalizedId);
  for (const candidate of candidates) {
    const { data } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();
    if (data) return true;
  }
  return false;
}

function resolveLessonId(lessonId: string): string {
  return canonicalLessonId(normalizeLessonRouteId(lessonId));
}

async function fetchActivityOrError(
  activityId: string
): Promise<AdminRollbackResult<AdminActivityRow>> {
  const activity = await getAdminActivityById(activityId);
  if (!activity) {
    return { data: null, error: "Activity log олдсонгүй." };
  }
  return { data: activity, error: null };
}

async function applyLessonPatch(
  lessonId: string,
  patch: Record<string, unknown>
): Promise<AdminRollbackResult<{ id: string }>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  if (Object.keys(patch).length === 0) {
    return { data: null, error: "Сэргээх field байхгүй." };
  }

  const resolvedId = resolveLessonId(lessonId);
  const candidates = lessonIdQueryCandidates(resolvedId);

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("lessons")
      .update(patch)
      .eq("id", candidate)
      .select("id")
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message || "Rollback хадгалахад алдаа." };
    }
    if (data) {
      return { data: { id: String(data.id) }, error: null };
    }
  }

  return { data: null, error: "Хичээл олдсонгүй." };
}

async function logRollbackExecuted(
  original: AdminActivityRow,
  restoredFields: string[]
): Promise<void> {
  await logAdminActivity({
    action: ADMIN_ACTIVITY_ACTIONS.rollbackExecuted,
    entityType: "activity",
    entityId: original.id,
    lessonId: original.lessonId ?? undefined,
    title: `Rollback executed for ${original.action}`,
    description: original.title,
    metadata: {
      rolledBackAction: original.action,
      restoredFields,
      originalActivityId: original.id,
    },
    beforeSnapshot: original.afterSnapshot ?? undefined,
    afterSnapshot: original.beforeSnapshot ?? undefined,
    diffSummary: {
      rolledBackAction: original.action,
      restoredFields,
    },
  });
}

async function executeRollbackForActivity(
  activity: AdminActivityRow
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const eligibility = canRollbackActivity(activity);
  if (!eligibility.supported || !eligibility.kind || !activity.lessonId) {
    return { data: null, error: eligibility.reason ?? "Rollback дэмжигдэхгүй." };
  }

  const exists = await lessonExists(activity.lessonId);
  if (!exists) {
    return { data: null, error: "Хичээл олдсонгүй — rollback хийх боломжгүй." };
  }

  const snapshot = activity.beforeSnapshot!;
  let patch: Record<string, unknown> = {};

  if (eligibility.kind === "metadata") {
    patch = buildDbPatch(snapshot, METADATA_DB_MAP, METADATA_SNAPSHOT_KEYS);
    return finalizeRollback(activity, patch, eligibility.restoredFields);
  }
  if (eligibility.kind === "media") {
    patch = buildDbPatch(snapshot, MEDIA_DB_MAP, MEDIA_SNAPSHOT_KEYS);
    return finalizeRollback(activity, patch, eligibility.restoredFields);
  }
  if (eligibility.kind === "status") {
    patch = buildDbPatch(snapshot, METADATA_DB_MAP, STATUS_SNAPSHOT_KEYS);
    return finalizeRollback(activity, patch, eligibility.restoredFields);
  }
  if (eligibility.kind === "release") {
    patch = buildDbPatch(snapshot, RELEASE_DB_MAP, RELEASE_SNAPSHOT_KEYS);
    return finalizeRollback(activity, patch, eligibility.restoredFields);
  }

  return { data: null, error: "Rollback төрөл тодорхойгүй." };
}

async function finalizeRollback(
  activity: AdminActivityRow,
  patch: Record<string, unknown>,
  restoredFields: string[]
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const applied = await applyLessonPatch(activity.lessonId!, patch);
  if (applied.error || !applied.data) {
    return { data: null, error: applied.error ?? "Rollback амжилтгүй." };
  }

  await logRollbackExecuted(activity, restoredFields);

  return {
    data: {
      lessonId: applied.data.id,
      restoredFields,
    },
    error: null,
  };
}

export async function previewRollback(
  activityId: string
): Promise<RollbackPreviewResult> {
  const activity = await getAdminActivityById(activityId);
  if (!activity) {
    return {
      supported: false,
      reason: "Activity log олдсонгүй.",
      restoredFields: [],
      kind: null,
      activity: null,
      lessonExists: false,
    };
  }

  const eligibility = canRollbackActivity(activity);
  const exists = activity.lessonId
    ? await lessonExists(activity.lessonId)
    : false;

  if (eligibility.supported && !exists) {
    return {
      ...eligibility,
      supported: false,
      reason: "Хичээл олдсонгүй — rollback хийх боломжгүй.",
      activity,
      lessonExists: false,
    };
  }

  return {
    ...eligibility,
    activity,
    lessonExists: exists,
  };
}

export async function executeRollback(
  activityId: string
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  if (!supabase || !hasSupabaseConfig) return notConfigured();

  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };

  const activityResult = await fetchActivityOrError(activityId);
  if (activityResult.error || !activityResult.data) {
    return { data: null, error: activityResult.error ?? "Activity олдсонгүй." };
  }

  return executeRollbackForActivity(activityResult.data);
}

export async function rollbackLessonMetadata(
  activityId: string
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const activityResult = await fetchActivityOrError(activityId);
  if (activityResult.error || !activityResult.data) {
    return { data: null, error: activityResult.error };
  }
  if (getRollbackKind(activityResult.data.action) !== "metadata") {
    return { data: null, error: "Metadata rollback зөвхөн metadata action дээр." };
  }
  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };
  return executeRollbackForActivity(activityResult.data);
}

export async function rollbackLessonMedia(
  activityId: string
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const activityResult = await fetchActivityOrError(activityId);
  if (activityResult.error || !activityResult.data) {
    return { data: null, error: activityResult.error };
  }
  if (getRollbackKind(activityResult.data.action) !== "media") {
    return { data: null, error: "Media rollback зөвхөн media action дээр." };
  }
  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };
  return executeRollbackForActivity(activityResult.data);
}

export async function rollbackLessonStatus(
  activityId: string
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const activityResult = await fetchActivityOrError(activityId);
  if (activityResult.error || !activityResult.data) {
    return { data: null, error: activityResult.error };
  }
  if (getRollbackKind(activityResult.data.action) !== "status") {
    return { data: null, error: "Status rollback зөвхөн status action дээр." };
  }
  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };
  return executeRollbackForActivity(activityResult.data);
}

export async function rollbackReleaseFields(
  activityId: string
): Promise<AdminRollbackResult<RollbackExecuteResult>> {
  const activityResult = await fetchActivityOrError(activityId);
  if (activityResult.error || !activityResult.data) {
    return { data: null, error: activityResult.error };
  }
  if (getRollbackKind(activityResult.data.action) !== "release") {
    return {
      data: null,
      error: "Release rollback зөвхөн release action дээр.",
    };
  }
  const gate = await requireAdmin();
  if (gate.error) return { data: null, error: gate.error };
  return executeRollbackForActivity(activityResult.data);
}
