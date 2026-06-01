import { isPrelessonPackage } from "@/lib/admin/lesson-package-type";
import { isHangulSyllable, isSingleHangulJamo } from "@/lib/games/game-data-core";
import { inferLessonLanguage } from "@/lib/language-track";
import { resolveLessonTypeTag } from "@/lib/lesson-content-type";
import { isHskFlashcardVocabularyLesson } from "@/lib/lesson/hsk-vocabulary-ui";
import { categorizeVocabularyForTranslate } from "@/lib/quiz/smart-options";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export type VocabularyViewMode = "flashcard" | "list";

type KoreanLessonPick = Pick<
  LessonContent,
  "id" | "courseId" | "language" | "title" | "chineseTitle" | "lessonType" | "sourceNote"
>;

/** True when vocabulary should default to flashcard study (Korean / Hangul / HSK). */
export function isFlashcardVocabularyLesson(
  lesson: KoreanLessonPick,
  vocabulary: VocabularyWord[] = []
): boolean {
  return (
    isKoreanFlashcardVocabularyLesson(lesson, vocabulary) ||
    isHskFlashcardVocabularyLesson(lesson, vocabulary)
  );
}

/** True when vocabulary should default to flashcard study (Korean / Hangul). */
export function isKoreanFlashcardVocabularyLesson(
  lesson: KoreanLessonPick,
  vocabulary: VocabularyWord[] = []
): boolean {
  const courseId = lesson.courseId.toLowerCase();
  const langTag = lesson.language?.trim().toLowerCase() ?? "";

  if (courseId.startsWith("korean")) return true;
  if (inferLessonLanguage(lesson) === "ko") return true;
  if (langTag.startsWith("ko")) return true;

  const lessonType = resolveLessonTypeTag(lesson)?.toLowerCase();
  if (lessonType === "hangul") return true;

  const titles = `${lesson.title} ${lesson.chineseTitle}`;
  if (titles.includes("한글") || /hangul/i.test(lesson.id)) return true;

  if (vocabulary.some((word) => word.hskLevel.toUpperCase().startsWith("KR"))) {
    return true;
  }

  if (
    isPrelessonPackage(lesson) &&
    courseId.startsWith("korean")
  ) {
    return true;
  }

  return false;
}

export function koreanVocabularyPageTitle(lesson: KoreanLessonPick): string {
  const lessonType = resolveLessonTypeTag(lesson)?.toLowerCase();
  const isHangul =
    lessonType === "hangul" ||
    lesson.title.includes("한글") ||
    lesson.chineseTitle.includes("한글") ||
    /hangul/i.test(lesson.id);

  if (isHangul) return "Үсэг сурах";
  return "한글 картаар сурах";
}

export function koreanVocabularyStudyCtaLabel(lesson: KoreanLessonPick): string {
  const lessonType = resolveLessonTypeTag(lesson)?.toLowerCase();
  const isHangul =
    lessonType === "hangul" ||
    lesson.title.includes("한글") ||
    lesson.chineseTitle.includes("한글") ||
    /hangul/i.test(lesson.id);

  if (isHangul) return "Картаар үсэг сурах";
  return "Картаар сурах";
}

/** Small section label for Hangul grouping (vowel, consonant, syllable, first word). */
export function getHangulVocabGroupLabel(word: VocabularyWord): string | null {
  for (const tag of word.skillTags ?? []) {
    const t = tag.toLowerCase();
    if (t.includes("vowel") || t === "hangul_vowel") return "Эгшиг";
    if (t.includes("consonant") || t === "hangul_consonant") return "Гийгүүлэгч";
    if (t.includes("syllable")) return "Үе";
    if (t.includes("word") || t.includes("first")) return "Эхний үг";
  }

  const section = word.lessonSection?.toLowerCase() ?? "";
  if (section.includes("vowel")) return "Эгшиг";
  if (section.includes("consonant")) return "Гийгүүлэгч";
  if (section.includes("syllable")) return "Үе";
  if (section.includes("word")) return "Эхний үг";

  const level = word.hskLevel.toLowerCase();
  if (level.includes("vowel")) return "Эгшиг";
  if (level.includes("consonant")) return "Гийгүүлэгч";
  if (level.includes("syllable")) return "Үе";

  const category = categorizeVocabularyForTranslate(word);
  if (category === "hangul_vowel") return "Эгшиг";
  if (category === "hangul_consonant") return "Гийгүүлэгч";
  if (isHangulSyllable(word.chinese) && !isSingleHangulJamo(word.chinese)) {
    return "Үе";
  }

  return null;
}

export function resolveInitialVocabularyViewMode(
  lesson: KoreanLessonPick,
  vocabulary: VocabularyWord[],
  queryView?: string | null
): VocabularyViewMode {
  const normalized = queryView?.trim().toLowerCase();
  if (normalized === "list") return "list";
  if (normalized === "flashcard" || normalized === "card") return "flashcard";
  return isFlashcardVocabularyLesson(lesson, vocabulary)
    ? "flashcard"
    : "list";
}
