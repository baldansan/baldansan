import type { HskLessonProfileId } from "@/lib/import/chinese-hsk-profiles";
import type { LessonImportPreview } from "@/lib/import/lesson-zip-import";

export type HskImportPreview = LessonImportPreview & {
  hskLevel?: number;
  lessonProfile?: HskLessonProfileId;
  profileBadgeLabel?: string;
  lessonNumber?: number | null;
  bookPart?: string | null;
  textCount?: number;
  workbookListeningCount?: number;
  workbookReadingCount?: number;
  workbookWritingCount?: number;
  workbookExerciseCount?: number;
  studySectionCount?: number;
  guidedStepCount?: number;
  hasPronunciationContent?: boolean;
  hasPinyinContent?: boolean;
  hasToneContent?: boolean;
  hasTeacherNotes?: boolean;
  mediaImageCount?: number;
  uploadedImageCount?: number;
  heroImageFound?: boolean;
  imageStorageStatus?: "uploaded" | "package-reference-only" | "missing";
  videoRequired?: boolean;
  storesJsonSourceNote?: boolean;
  answerStatus?: string | null;
  textStatus?: string | null;
  audioStatus?: string | null;
};

export type HskLessonZipValidationExtras = {
  hskProfile?: HskLessonProfileId | null;
};
