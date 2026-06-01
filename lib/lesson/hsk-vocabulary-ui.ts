import { isHskStructuredLesson } from "@/lib/lesson/hsk-lesson-content";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

type LessonPick = Pick<
  LessonContent,
  "id" | "courseId" | "language" | "title" | "chineseTitle" | "lessonType" | "sourceNote"
>;

/** HSK lessons default to interactive flashcard vocabulary study. */
export function isHskFlashcardVocabularyLesson(
  lesson: LessonPick,
  vocabulary: VocabularyWord[] = []
): boolean {
  if (!isHskStructuredLesson(lesson)) return false;
  return vocabulary.length > 0;
}

export function hskVocabularyPageTitle(_lesson: LessonPick): string {
  return "Үгийн сан";
}

export function hskVocabularyStudyCtaLabel(): string {
  return "Картаар сурах";
}
