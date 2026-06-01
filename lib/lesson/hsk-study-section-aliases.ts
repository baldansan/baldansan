/** Key aliases for resolving HSK study sections from varied package formats (V1–V5). */

export const HSK_OBJECTIVE_ALIASES = [
  "objectives",
  "objective",
  "lessonintro",
  "lesson_intro",
  "goals",
  "зорилго",
] as const;

export const HSK_PINYIN_ALIASES = [
  "pinyin",
  "pronunciation",
  "pinyinpronunciation",
  "pinyin_pronunciation",
  "pinyinpronunciationnotes",
  "дуудлага",
] as const;

export const HSK_TONE_ALIASES = [
  "tone",
  "tones",
  "toneexplanation",
  "tone_explanation",
  "toneexamples",
  "өнгө",
] as const;

export const HSK_TEACHER_NOTE_ALIASES = [
  "teachernote",
  "teachernotes",
  "teacher_notes",
  "teachingnotes",
  "teaching_notes",
  "teachersbook",
  "teachers_book",
  "багшийн тайлбар",
] as const;

export const HSK_SENTENCE_ALIASES = [
  "sentenceexplanation",
  "sentence_explanation",
  "sentenceexplanations",
  "grammarpatterns",
  "basicSentences",
  "grammar",
] as const;

export const HSK_CHARACTER_ALIASES = [
  "characters",
  "character",
  "hanzi",
  "stroke",
  "writing",
  "ханз",
] as const;

export const HSK_STUDY_GUIDE_ALIASES = [
  "studyguide",
  "study_guide",
  "practiceguide",
  "practice_guide",
  "workbookinstruction",
  "workbook_instruction",
  "дасгал",
] as const;

export const HSK_DIALOGUE_ALIASES = [
  "dialogues",
  "dialogue",
  "exchanges",
  "харилцан яриа",
] as const;

export function normalizeHskSectionKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_·./-]+/g, "");
}

export function hskSectionKeyMatches(
  candidate: unknown,
  aliases: readonly string[]
): boolean {
  const normalized = normalizeHskSectionKey(candidate);
  if (!normalized) return false;
  return aliases.some((alias) => {
    const aliasNorm = normalizeHskSectionKey(alias);
    return (
      normalized === aliasNorm ||
      normalized.includes(aliasNorm) ||
      aliasNorm.includes(normalized)
    );
  });
}

export function hskRecordKeyMatches(
  key: string,
  aliases: readonly string[]
): boolean {
  return hskSectionKeyMatches(key, aliases);
}
