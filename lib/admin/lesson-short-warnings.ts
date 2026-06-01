import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import type { LessonQaReport } from "@/lib/admin/lesson-qa";
import {
  hasAudioUrl,
  hasThumbnailUrl,
} from "@/lib/lesson-media";
import { hasHskPackageImages } from "@/lib/lesson/hsk-package-media";

/** Short human-readable warnings for the lessons table. */
export function getLessonShortWarnings(report: LessonQaReport): string[] {
  const { lesson } = report;
  const prelesson = isPrelessonPackage(lesson);
  const warnings: string[] = [];

  if (!hasAudioUrl(lesson) && !prelesson) {
    warnings.push("Audio missing");
  }
  if (!hasThumbnailUrl(lesson) && !prelesson) {
    if (hasHskPackageImages(lesson)) {
      warnings.push("Package images / Needs storage");
    } else {
      warnings.push("Image missing");
    }
  }
  if (report.qaStatus === "needs_review") {
    warnings.push("Needs review");
  }

  return warnings;
}

/** Full warning list for Advanced details panel. */
export function getLessonDetailedWarnings(report: LessonQaReport): string[] {
  return report.warnings;
}
