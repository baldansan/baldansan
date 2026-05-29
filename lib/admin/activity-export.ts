import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";

export type ActivityExportRecord = {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  diffSummary: Record<string, unknown>;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function formatActivityForExport(
  activity: AdminActivityRow
): ActivityExportRecord {
  return {
    id: activity.id,
    createdAt: activity.createdAt,
    actorEmail: activity.actorEmail,
    actorUserId: activity.actorUserId,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    lessonId: activity.lessonId,
    title: activity.title,
    description: activity.description,
    metadata: activity.metadata,
    beforeSnapshot: activity.beforeSnapshot,
    afterSnapshot: activity.afterSnapshot,
    diffSummary: activity.diffSummary,
  };
}

export function buildActivityCsv(activities: AdminActivityRow[]): string {
  const headers = [
    "created_at",
    "actor_email",
    "action",
    "entity_type",
    "entity_id",
    "lesson_id",
    "title",
    "description",
  ];

  const lines = [
    headers.join(","),
    ...activities.map((activity) =>
      [
        activity.createdAt,
        activity.actorEmail ?? "",
        activity.action,
        activity.entityType,
        activity.entityId ?? "",
        activity.lessonId ?? "",
        activity.title,
        activity.description ?? "",
      ]
        .map((value) => escapeCsvCell(cellString(value)))
        .join(",")
    ),
  ];

  return lines.join("\n");
}

export function buildActivityJson(activities: AdminActivityRow[]): string {
  return JSON.stringify(
    activities.map((activity) => formatActivityForExport(activity)),
    null,
    2
  );
}

export function downloadTextFile(
  contents: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
