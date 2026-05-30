import type { DetectedPackageType } from "@/lib/import/detect-lesson-package-type";
import type { LessonZipValidation } from "@/lib/import/lesson-zip-import";

export type WrongImporterMismatch = {
  expectedTrack: "chinese" | "korean";
  detectedTrack: Exclude<DetectedPackageType, "unknown">;
  reason: string;
  redirectHref: string;
  message: string;
};

const KOREAN_WRONG_MESSAGE =
  "Энэ ZIP нь Солонгос хичээлийн package байна. Korean importer ашиглана уу.";

const CHINESE_WRONG_MESSAGE =
  "Энэ ZIP нь Хятад/HSK хичээлийн package байна. Chinese importer ашиглана уу.";

export function buildWrongImporterValidation(
  expectedTrack: "chinese" | "korean",
  detected: { type: Exclude<DetectedPackageType, "unknown">; reason: string }
): LessonZipValidation {
  const redirectHref =
    detected.type === "korean" ? "/admin/import/korean" : "/admin/import/chinese";
  const message =
    expectedTrack === "chinese" ? KOREAN_WRONG_MESSAGE : CHINESE_WRONG_MESSAGE;

  return {
    ok: false,
    manifest: null,
    lesson: null,
    importContext: null,
    vocabulary: [],
    quizQuestions: [],
    subtitles: [],
    mediaFiles: [],
    warnings: [],
    errors: [],
    info: [message],
    preview: null,
    importPayload: null,
    contentValidation: null,
    wrongImporter: {
      expectedTrack,
      detectedTrack: detected.type,
      reason: detected.reason,
      redirectHref,
      message,
    },
  };
}
