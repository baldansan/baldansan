import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

export const SUPPORTED_ROLLBACK_ACTIONS = new Set<string>([
  "lesson_metadata_updated",
  "media_updated",
  "media_cleared",
  "lesson_status_changed",
  "lesson_published",
  "lesson_unpublished",
  "lesson_archived",
  "release_status_updated",
  "qa_status_updated",
  "release_notes_updated",
  "lesson_approved",
]);

export type RollbackKind = "metadata" | "media" | "status" | "release";

export const METADATA_SNAPSHOT_KEYS = [
  "title",
  "chineseTitle",
  "subtitle",
  "description",
  "duration",
  "status",
  "orderIndex",
  "vocabularyCount",
  "quizCount",
] as const;

export const MEDIA_SNAPSHOT_KEYS = [
  "videoUrl",
  "thumbnailUrl",
  "audioUrl",
  "sourceNote",
  "mediaStatus",
] as const;

export const STATUS_SNAPSHOT_KEYS = ["status"] as const;

export const RELEASE_SNAPSHOT_KEYS = [
  "releaseStatus",
  "qaStatus",
  "releaseNotes",
  "approvedAt",
  "approvedBy",
] as const;

export function getRollbackKind(action: string): RollbackKind | null {
  if (action === "lesson_metadata_updated") return "metadata";
  if (action === "media_updated" || action === "media_cleared") {
    return "media";
  }
  if (
    action === "lesson_status_changed" ||
    action === "lesson_published" ||
    action === "lesson_unpublished" ||
    action === "lesson_archived"
  ) {
    return "status";
  }
  if (
    action === "release_status_updated" ||
    action === "qa_status_updated" ||
    action === "release_notes_updated" ||
    action === "lesson_approved"
  ) {
    return "release";
  }
  return null;
}

function keysPresent(
  snapshot: Record<string, unknown>,
  keys: readonly string[]
): string[] {
  return keys.filter((key) =>
    Object.prototype.hasOwnProperty.call(snapshot, key)
  );
}

export type RollbackEligibility = {
  supported: boolean;
  reason?: string;
  restoredFields: string[];
  kind: RollbackKind | null;
};

export function canRollbackActivity(activity: AdminActivityRow): RollbackEligibility {
  if (!SUPPORTED_ROLLBACK_ACTIONS.has(activity.action)) {
    return {
      supported: false,
      reason: "Rollback энэ action дээр одоогоор дэмжигдээгүй.",
      restoredFields: [],
      kind: null,
    };
  }

  if (!activity.beforeSnapshot || Object.keys(activity.beforeSnapshot).length === 0) {
    return {
      supported: false,
      reason: "Before snapshot байхгүй — rollback хийх боломжгүй.",
      restoredFields: [],
      kind: getRollbackKind(activity.action),
    };
  }

  if (!activity.lessonId) {
    return {
      supported: false,
      reason: "Lesson ID байхгүй — rollback хийх боломжгүй.",
      restoredFields: [],
      kind: getRollbackKind(activity.action),
    };
  }

  const kind = getRollbackKind(activity.action);
  if (!kind) {
    return {
      supported: false,
      reason: "Rollback төрөл тодорхойгүй.",
      restoredFields: [],
      kind: null,
    };
  }

  const keyMap = {
    metadata: METADATA_SNAPSHOT_KEYS,
    media: MEDIA_SNAPSHOT_KEYS,
    status: STATUS_SNAPSHOT_KEYS,
    release: RELEASE_SNAPSHOT_KEYS,
  } as const;

  const restoredFields = keysPresent(activity.beforeSnapshot, keyMap[kind]);
  if (restoredFields.length === 0) {
    return {
      supported: false,
      reason: "Before snapshot-д сэргээх field олдсонгүй.",
      restoredFields: [],
      kind,
    };
  }

  return { supported: true, restoredFields, kind };
}

export function activityRollbackAvailable(activity: AdminActivityRow): boolean {
  return canRollbackActivity(activity).supported;
}

export const METADATA_DB_MAP: Record<string, string> = {
  title: "title",
  chineseTitle: "chinese_title",
  subtitle: "subtitle",
  description: "description",
  duration: "duration",
  status: "status",
  orderIndex: "order_index",
  vocabularyCount: "vocabulary_count",
  quizCount: "quiz_count",
};

export const MEDIA_DB_MAP: Record<string, string> = {
  videoUrl: "video_url",
  thumbnailUrl: "thumbnail_url",
  audioUrl: "audio_url",
  sourceNote: "source_note",
  mediaStatus: "media_status",
};

export const RELEASE_DB_MAP: Record<string, string> = {
  releaseStatus: "release_status",
  qaStatus: "qa_status",
  releaseNotes: "release_notes",
  approvedAt: "approved_at",
  approvedBy: "approved_by",
};

export function buildDbPatch(
  snapshot: Record<string, unknown>,
  fieldMap: Record<string, string>,
  allowedKeys: readonly string[]
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) continue;
    const column = fieldMap[key];
    if (!column) continue;
    patch[column] = snapshot[key] ?? null;
  }
  return patch;
}
