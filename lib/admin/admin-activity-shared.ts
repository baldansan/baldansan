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
  createdAt: string;
};

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
