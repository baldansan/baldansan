import type { LessonContent, LessonMediaStatus } from "@/types/lesson-content";

export const MEDIA_STATUS_VALUES: LessonMediaStatus[] = [
  "missing",
  "pending",
  "ready",
];

export function normalizeMediaStatus(
  status?: string | null
): LessonMediaStatus {
  if (status === "pending" || status === "ready") return status;
  return "missing";
}

export function hasVideoUrl(
  lesson: Pick<LessonContent, "videoUrl">
): boolean {
  return Boolean(lesson.videoUrl?.trim());
}

export function hasThumbnailUrl(
  lesson: Pick<LessonContent, "thumbnailUrl">
): boolean {
  return Boolean(lesson.thumbnailUrl?.trim());
}

export function hasAudioUrl(lesson: Pick<LessonContent, "audioUrl">): boolean {
  return Boolean(lesson.audioUrl?.trim());
}

export function isMediaReady(lesson: LessonContent): boolean {
  return (
    normalizeMediaStatus(lesson.mediaStatus) === "ready" && hasVideoUrl(lesson)
  );
}

export function mediaStatusLabel(status?: string | null): string {
  const normalized = normalizeMediaStatus(status);
  if (normalized === "ready") return "Ready";
  if (normalized === "pending") return "Pending";
  return "Missing";
}

export function getLessonMediaWarnings(lesson: LessonContent): string[] {
  const warnings: string[] = [];
  const status = normalizeMediaStatus(lesson.mediaStatus);

  if (!hasVideoUrl(lesson)) {
    warnings.push("No video URL");
  }
  if (status === "pending") {
    warnings.push("Media pending");
  }
  if (!hasThumbnailUrl(lesson)) {
    warnings.push("Thumbnail missing");
  }

  return warnings;
}
