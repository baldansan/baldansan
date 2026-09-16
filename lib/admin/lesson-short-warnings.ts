import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import type { LessonQaReport } from "@/lib/admin/lesson-qa";
import {
  hasAudioUrl,
  hasThumbnailUrl,
} from "@/lib/lesson-media";
import { hasHskPackageImagesNeedingStorage } from "@/lib/lesson/hsk-package-media";

/** Short human-readable warnings for the lessons table. */
export function getLessonShortWarnings(report: LessonQaReport): string[] {
  const { lesson } = report;
  const prelesson = isPrelessonPackage(lesson);
  const warnings: string[] = [];

  if (!hasAudioUrl(lesson) && !prelesson) {
    warnings.push("Аудио алга");
  }
  if (!hasThumbnailUrl(lesson) && !prelesson) {
    if (hasHskPackageImagesNeedingStorage(lesson)) {
      warnings.push("Багцын зураг — Storage хэрэгтэй");
    } else {
      warnings.push("Зураг алга");
    }
  }
  if (report.qaStatus === "needs_review") {
    warnings.push("Шалгах шаардлагатай");
  }

  return warnings;
}

/** Full warning list for Advanced details panel. */
export function getLessonDetailedWarnings(report: LessonQaReport): string[] {
  return report.warnings;
}
