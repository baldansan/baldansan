import type { AdminActivityRow } from "@/lib/admin/admin-activity-shared";
import {
  formatMongoliaDateTime,
  formatMongoliaDateTimeWithLabel,
} from "@/lib/datetime/mongolia-time";

const actionStyles: Record<string, string> = {
  lesson_created: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_published: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  task_resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lesson_unpublished: "bg-amber-50 text-amber-900 ring-amber-200",
  lesson_archived: "bg-slate-100 text-slate-700 ring-slate-200",
  task_dismissed: "bg-slate-100 text-slate-600 ring-slate-200",
  bulk_import_completed: "bg-sky-50 text-sky-800 ring-sky-200",
  backup_restored: "bg-sky-50 text-sky-800 ring-sky-200",
  media_uploaded: "bg-violet-50 text-violet-800 ring-violet-200",
  task_started: "bg-sky-50 text-sky-800 ring-sky-200",
  release_notes_updated: "bg-sky-50 text-sky-800 ring-sky-200",
  rollback_executed: "bg-violet-50 text-violet-800 ring-violet-200",
};

/** Display-only Mongolian labels. Keys stay as the raw DB action values. */
const actionLabels: Record<string, string> = {
  lesson_created: "Хичээл үүсгэсэн",
  lesson_published: "Хичээл нийтэлсэн",
  lesson_unpublished: "Нийтлэхээ болисон",
  lesson_archived: "Хичээл архивласан",
  lesson_approved: "Хичээл баталсан",
  lesson_deleted: "Хичээл устгасан",
  lesson_metadata_updated: "Ерөнхий мэдээлэл засварласан",
  task_started: "Ажил эхлүүлсэн",
  task_resolved: "Ажил шийдсэн",
  task_dismissed: "Ажил хаасан",
  task_updated: "Ажил шинэчилсэн",
  bulk_import_completed: "Бөөнөөр оруулж дууссан",
  backup_restored: "Нөөц хуулбар сэргээсэн",
  backup_exported: "Нөөц хуулбар гаргасан",
  media_uploaded: "Медиа байршуулсан",
  media_updated: "Медиа шинэчилсэн",
  release_notes_updated: "Хувилбарын тэмдэглэл шинэчилсэн",
  release_status_updated: "Хувилбарын төлөв шинэчилсэн",
  rollback_executed: "Буцаалт хийсэн",
  qa_status_updated: "Чанарын шалгалтын төлөв шинэчилсэн",
  status_updated: "Төлөв шинэчилсэн",
  review_started: "Шалгалт эхэлсэн",
  subtitle_created: "Хадмал нэмсэн",
  subtitle_deleted: "Хадмал устгасан",
  vocabulary_created: "Үг нэмсэн",
  vocabulary_deleted: "Үг устгасан",
  quiz_created: "Дасгал нэмсэн",
  quiz_deleted: "Дасгал устгасан",
  organization_created: "Байгууллага үүсгэсэн",
  assignment_created: "Даалгавар үүсгэсэн",
};

/** Display-only Mongolian labels. Keys stay as the raw DB entity_type values. */
const entityTypeLabels: Record<string, string> = {
  lesson: "Хичээл",
  quiz: "Дасгал",
  vocabulary: "Үгсийн сан",
  subtitle: "Хадмал",
  media: "Медиа",
  task: "Ажил",
  activity: "Үйлдэл",
};

export function labelForAction(action: string): string {
  return actionLabels[action] ?? action.replaceAll("_", " ");
}

export function labelForEntityType(entityType: string): string {
  return entityTypeLabels[entityType] ?? entityType;
}

type Props = {
  action: string;
};

export function ActivityBadge({ action }: Props) {
  const style =
    actionStyles[action] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${style}`}
    >
      {labelForAction(action)}
    </span>
  );
}

export function EntityTypeBadge({ entityType }: { entityType: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {labelForEntityType(entityType)}
    </span>
  );
}

export function formatActivityTime(iso: string): string {
  return formatMongoliaDateTimeWithLabel(iso) || iso;
}

/** Compact activity list timestamp without label prefix. */
export function formatActivityTimeCompact(iso: string): string {
  return formatMongoliaDateTime(iso) || iso;
}

export type { AdminActivityRow };
