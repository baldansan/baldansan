export type AdminActivityRow = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
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
  createdAt: string;
};

export function mapActivityLogRow(row: Record<string, unknown>): AdminActivityRow {
  return {
    id: String(row.id),
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    actorEmail: row.actor_email ? String(row.actor_email) : null,
    action: String(row.action),
    entityType: String(row.entity_type),
    entityId: row.entity_id ? String(row.entity_id) : null,
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    beforeSnapshot:
      row.before_snapshot && typeof row.before_snapshot === "object"
        ? (row.before_snapshot as Record<string, unknown>)
        : null,
    afterSnapshot:
      row.after_snapshot && typeof row.after_snapshot === "object"
        ? (row.after_snapshot as Record<string, unknown>)
        : null,
    diffSummary:
      row.diff_summary && typeof row.diff_summary === "object"
        ? (row.diff_summary as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

export type AdminActivitySummary = {
  total: number;
  today: number;
  lessonActions: number;
  contentActions: number;
  publishReleaseActions: number;
  taskActions: number;
};

export type AdminActivityLogOptions = {
  action?: string;
  entityType?: string;
  lessonId?: string;
  actorUserId?: string;
  dateRange?: "all" | "today" | "7d" | "30d";
  search?: string;
  limit?: number;
};

function shortenUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 8)}…`;
}

export function formatActivityActor(row: AdminActivityRow): string {
  if (row.actorEmail) return row.actorEmail;
  if (row.actorUserId) return shortenUserId(row.actorUserId);
  return "—";
}
