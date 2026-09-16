import type { ImportValidationContext, LessonImportPayload } from "@/lib/supabase/admin-import";
import type { LessonContent } from "@/types/lesson-content";

export const MIN_VOCABULARY_FOR_PUBLISH = 5;
export const MIN_QUIZ_FOR_PUBLISH = 3;

export type ImportQaStatus = "ready" | "needs_review" | "missing_content";

export type LessonContentQaReport = {
  status: ImportQaStatus;
  hasMetadata: boolean;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
  hskDistribution: Record<string, number>;
  missingPinyinSubtitleCount: number;
  missingPinyinVocabCount: number;
  missingMongolianSubtitleCount: number;
  missingMongolianVocabCount: number;
  quizAnswerMismatchCount: number;
  duplicateVocabularyChinese: string[];
  emptyExampleCount: number;
  errors: string[];
  warnings: string[];
};

export type SubtitleQaRow = {
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  start_time: string;
  end_time: string;
};

export type VocabularyQaRow = {
  chinese: string;
  pinyin: string | null;
  mongolian: string;
  hsk_level: string | null;
  example_chinese: string | null;
  example_mongolian: string | null;
};

export type QuizQaRow = {
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
};

function hasLessonMetadata(lesson: LessonContent): boolean {
  return Boolean(
    lesson.title?.trim() &&
      lesson.chineseTitle?.trim() &&
      lesson.description?.trim() &&
      lesson.duration?.trim()
  );
}

function isShortMongolian(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && t.length < 4;
}

export function analyzeStoredLessonContent(
  lesson: LessonContent,
  subtitles: SubtitleQaRow[],
  vocabulary: VocabularyQaRow[],
  quiz: QuizQaRow[]
): LessonContentQaReport {
  const warnings: string[] = [];
  const errors: string[] = [];

  const hasMetadata = hasLessonMetadata(lesson);
  const subtitleCount = subtitles.length;
  const vocabularyCount = vocabulary.length;
  const quizCount = quiz.length;

  const hskDistribution: Record<string, number> = {};
  let missingPinyinSubtitleCount = 0;
  let missingPinyinVocabCount = 0;
  let missingMongolianSubtitleCount = 0;
  let missingMongolianVocabCount = 0;
  let emptyExampleCount = 0;
  let quizAnswerMismatchCount = 0;

  const vocabChineseSeen = new Map<string, number>();
  const duplicateVocabularyChinese: string[] = [];

  const timeRanges = new Map<string, number>();

  for (const [i, sub] of subtitles.entries()) {
    if (!sub.mongolian?.trim()) {
      missingMongolianSubtitleCount += 1;
    }
    if (!sub.pinyin?.trim()) {
      missingPinyinSubtitleCount += 1;
    }
    if (sub.mongolian?.trim() && isShortMongolian(sub.mongolian)) {
      warnings.push(`${i + 1}-р хадмал: монгол орчуулга хэт богино байна.`);
    }
    const rangeKey = `${sub.start_time}|${sub.end_time}`;
    if (timeRanges.has(rangeKey)) {
      warnings.push(
        `Хадмалын ${sub.start_time}–${sub.end_time} хугацаа давхардсан (${timeRanges.get(rangeKey)! + 1} ба ${i + 1}-р мөр).`
      );
    } else {
      timeRanges.set(rangeKey, i);
    }
  }

  for (const [i, word] of vocabulary.entries()) {
    const chinese = word.chinese?.trim() ?? "";
    if (!word.mongolian?.trim()) {
      missingMongolianVocabCount += 1;
    }
    if (!word.pinyin?.trim()) {
      missingPinyinVocabCount += 1;
    }
    if (!word.hsk_level?.trim()) {
      warnings.push(`"${chinese || i + 1}" үг: HSK түвшин дутуу.`);
    }
    if (word.mongolian?.trim() && isShortMongolian(word.mongolian)) {
      warnings.push(`"${chinese}" үг: монгол орчуулга хэт богино байна.`);
    }
    if (!word.example_chinese?.trim() || !word.example_mongolian?.trim()) {
      emptyExampleCount += 1;
    }

    if (chinese) {
      if (vocabChineseSeen.has(chinese)) {
        if (!duplicateVocabularyChinese.includes(chinese)) {
          duplicateVocabularyChinese.push(chinese);
        }
      } else {
        vocabChineseSeen.set(chinese, i);
      }
    }

    const level = word.hsk_level?.trim() || "Unknown";
    hskDistribution[level] = (hskDistribution[level] ?? 0) + 1;
  }

  for (const [i, q] of quiz.entries()) {
    const options = q.options ?? [];
    const correct = q.correct_answer?.trim() ?? "";
    if (options.length >= 2 && correct && !options.includes(correct)) {
      quizAnswerMismatchCount += 1;
      errors.push(
        `${i + 1}-р дасгал: зөв хариулт (correctAnswer) сонголтуудын дунд алга.`
      );
    }
  }

  if (duplicateVocabularyChinese.length > 0) {
    warnings.push(
      `Давхардсан хятад үг: ${duplicateVocabularyChinese.join(", ")}`
    );
  }

  const status = computeImportQaStatus({
    hasMetadata,
    subtitleCount,
    vocabularyCount,
    quizCount,
    missingMongolianSubtitleCount,
    missingMongolianVocabCount,
    quizAnswerMismatchCount,
    duplicateVocabularyChinese,
  });

  if (subtitleCount === 0) warnings.push("Хадмал алга.");
  if (vocabularyCount === 0) warnings.push("Үгсийн сан алга.");
  if (quizCount === 0) warnings.push("Дасгалын асуулт алга.");
  if (!hasMetadata) warnings.push("Ерөнхий мэдээлэл дутуу.");

  return {
    status,
    hasMetadata,
    subtitleCount,
    vocabularyCount,
    quizCount,
    hskDistribution,
    missingPinyinSubtitleCount,
    missingPinyinVocabCount,
    missingMongolianSubtitleCount,
    missingMongolianVocabCount,
    quizAnswerMismatchCount,
    duplicateVocabularyChinese,
    emptyExampleCount,
    errors,
    warnings,
  };
}

export function computeImportQaStatus(metrics: {
  hasMetadata: boolean;
  subtitleCount: number;
  vocabularyCount: number;
  quizCount: number;
  missingMongolianSubtitleCount: number;
  missingMongolianVocabCount: number;
  quizAnswerMismatchCount: number;
  duplicateVocabularyChinese: string[];
}): ImportQaStatus {
  const {
    hasMetadata,
    subtitleCount,
    vocabularyCount,
    quizCount,
    missingMongolianSubtitleCount,
    missingMongolianVocabCount,
    quizAnswerMismatchCount,
  } = metrics;

  if (subtitleCount === 0 && vocabularyCount === 0 && quizCount === 0) {
    return "missing_content";
  }

  const ready =
    hasMetadata &&
    subtitleCount > 0 &&
    vocabularyCount >= MIN_VOCABULARY_FOR_PUBLISH &&
    quizCount >= MIN_QUIZ_FOR_PUBLISH &&
    quizAnswerMismatchCount === 0 &&
    missingMongolianSubtitleCount === 0 &&
    missingMongolianVocabCount === 0;

  if (ready) {
    return "ready";
  }

  return "needs_review";
}

/** Extra QA checks on normalized import payload (warnings for import UI). */
export function analyzeImportPayloadExtras(
  payload: LessonImportPayload,
  context?: ImportValidationContext
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isKorean = context?.isKorean ?? false;
  const readingLabel = isKorean ? "дуудлага (romanization)" : "пиньинь";
  const levelLabel = isKorean ? "түвшин" : "HSK түвшин";

  const timeRanges = new Map<string, number>();
  payload.subtitles.forEach((sub, i) => {
    const key = `${sub.startTime}|${sub.endTime}`;
    if (timeRanges.has(key)) {
      errors.push(
        `Хадмалын ${sub.startTime}–${sub.endTime} хугацаа давхардсан (${timeRanges.get(key)} ба ${i} дугаарт).`
      );
    } else {
      timeRanges.set(key, i);
    }
    if (!sub.pinyin?.trim()) {
      warnings.push(`subtitles[${i}]: ${readingLabel} дутуу.`);
    }
    if (sub.mongolian.trim() && isShortMongolian(sub.mongolian)) {
      warnings.push(`subtitles[${i}]: монгол орчуулга хэт богино байна.`);
    }
  });

  const seenVocab = new Map<string, number>();
  payload.vocabulary.forEach((word, i) => {
    if (!word.pinyin?.trim()) {
      warnings.push(`vocabulary[${i}]: ${readingLabel} дутуу.`);
    }
    if (!word.hskLevel?.trim()) {
      warnings.push(
        `vocabulary[${i}] "${word.chinese}": ${levelLabel} дутуу.`
      );
    }
    if (word.mongolian.trim() && isShortMongolian(word.mongolian)) {
      warnings.push(
        `vocabulary[${i}] "${word.chinese}": монгол орчуулга хэт богино байна.`
      );
    }
    if (!word.exampleChinese?.trim() || !word.exampleMongolian?.trim()) {
      warnings.push(`vocabulary[${i}] "${word.chinese}": жишээ өгүүлбэр дутуу.`);
    }
    if (seenVocab.has(word.chinese)) {
      errors.push(
        `"${word.chinese}" үг давхардсан (${seenVocab.get(word.chinese)} ба ${i} дугаарт).`
      );
    } else {
      seenVocab.set(word.chinese, i);
    }
  });

  payload.quizQuestions.forEach((q, i) => {
    if (
      q.options.length >= 2 &&
      q.correctAnswer &&
      !q.options.includes(q.correctAnswer)
    ) {
      errors.push(
        `quizQuestions[${i}]: зөв хариулт (correctAnswer) сонголтуудын дунд алга.`
      );
    }
  });

  return { errors, warnings };
}
