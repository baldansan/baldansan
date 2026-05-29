import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

export type ActivityDiffField = {
  field: string;
  before: unknown;
  after: unknown;
};

export type ActivityDiffAddedField = {
  field: string;
  after: unknown;
};

export type ActivityDiffRemovedField = {
  field: string;
  before: unknown;
};

export type ActivityDiffResult = {
  changed: ActivityDiffField[];
  added: ActivityDiffAddedField[];
  removed: ActivityDiffRemovedField[];
  hasDiff: boolean;
};

function snapshotRecord(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function getActivityDiff(activity: {
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
}): ActivityDiffResult {
  const before = snapshotRecord(activity.beforeSnapshot);
  const after = snapshotRecord(activity.afterSnapshot);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  const changed: ActivityDiffField[] = [];
  const added: ActivityDiffAddedField[] = [];
  const removed: ActivityDiffRemovedField[] = [];

  for (const field of keys) {
    const hasBefore = Object.prototype.hasOwnProperty.call(before, field);
    const hasAfter = Object.prototype.hasOwnProperty.call(after, field);

    if (hasBefore && !hasAfter) {
      removed.push({ field, before: before[field] });
      continue;
    }
    if (!hasBefore && hasAfter) {
      added.push({ field, after: after[field] });
      continue;
    }
    if (hasBefore && hasAfter && !valuesEqual(before[field], after[field])) {
      changed.push({
        field,
        before: before[field],
        after: after[field],
      });
    }
  }

  return {
    changed,
    added,
    removed,
    hasDiff: changed.length > 0 || added.length > 0 || removed.length > 0,
  };
}

export function buildShallowDiffSummary(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const diff = getActivityDiff({ beforeSnapshot: before, afterSnapshot: after });
  return {
    changedFields: diff.changed.map((item) => item.field),
    changedCount: diff.changed.length,
    addedFields: diff.added.map((item) => item.field),
    removedFields: diff.removed.map((item) => item.field),
  };
}

export function activityHasSnapshot(row: AdminActivityRow): boolean {
  return row.beforeSnapshot != null || row.afterSnapshot != null;
}

export function activityHasDiffPreview(row: AdminActivityRow): boolean {
  if (!activityHasSnapshot(row)) {
    const summary = row.diffSummary ?? {};
    const changedCount = summary.changedCount;
    if (typeof changedCount === "number" && changedCount > 0) return true;
    const changedFields = summary.changedFields;
    if (Array.isArray(changedFields) && changedFields.length > 0) return true;
    return false;
  }
  return getActivityDiff(row).hasDiff || activityHasSnapshot(row);
}

export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
