import { getLessonPublishStatus } from "@/lib/lesson-publish";
import type {
  LessonContent,
  LessonContentStatus,
  LessonPublishStatus,
} from "@/types/lesson-content";

/** Planned publish statuses (DB Step 2+). `locked` maps to draft in admin UI for now. */
export type AdminContentStatus = "draft" | "available" | "archived";

export type AdminStatusFilter = "all" | AdminContentStatus;

export function toAdminContentStatus(
  status: LessonContentStatus | LessonPublishStatus | string
): AdminContentStatus {
  if (status === "available" || status === "published") return "available";
  if (status === "archived") return "archived";
  if (status === "draft") return "draft";
  return "draft";
}

export function getAdminPublishStatus(lesson: LessonContent): AdminContentStatus {
  return toAdminContentStatus(getLessonPublishStatus(lesson));
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
  lesson: LessonContent,
  filter: AdminStatusFilter
): boolean {
  if (filter === "all") return true;
  return getAdminPublishStatus(lesson) === filter;
}
