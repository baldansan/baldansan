import type { LessonContentStatus } from "@/types/lesson-content";

/** Planned publish statuses (DB Step 2+). `locked` maps to draft in admin UI for now. */
export type AdminContentStatus = "draft" | "available" | "archived";

export type AdminStatusFilter = "all" | AdminContentStatus;

export function toAdminContentStatus(
  status: LessonContentStatus | string
): AdminContentStatus {
  if (status === "available") return "available";
  if (status === "archived") return "archived";
  if (status === "draft") return "draft";
  return "draft";
}

export function adminStatusLabel(status: AdminContentStatus): string {
  switch (status) {
    case "available":
      return "Нийтлэгдсэн";
    case "archived":
      return "Архив";
    default:
      return "Ноорог";
  }
}

export function matchesStatusFilter(
  lessonStatus: LessonContentStatus | string,
  filter: AdminStatusFilter
): boolean {
  if (filter === "all") return true;
  return toAdminContentStatus(lessonStatus) === filter;
}
