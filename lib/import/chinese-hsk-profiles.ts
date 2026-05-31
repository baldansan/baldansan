/** HSK level import profiles for Chinese textbook ZIP packages. */

export type HskLessonProfileId =
  | "hsk1-pronunciation-character-basic"
  | "hsk2-basic-dialogue-sentence"
  | "hsk3-dialogue-reading-writing-review"
  | "hsk4-dialogue-shorttext-exam-workbook"
  | "hsk5-article-topic-vocab-nuance-writing"
  | "hsk6-advanced-reading-output-summary";

export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type HskProfileDefinition = {
  id: HskLessonProfileId;
  hskLevel: HskLevel;
  badgeLabel: string;
  badgeShort: string;
  /** Section keys that must be present somewhere in the package. */
  requiredSections: readonly string[];
  optionalSections: readonly string[];
  /** When true, quiz.json (or miniQuiz section) is required. */
  requiresQuiz: boolean;
  recommendedTextCount?: number;
  recommendedTextTypes?: readonly string[];
};

export const HSK_PROFILES: Record<HskLessonProfileId, HskProfileDefinition> = {
  "hsk1-pronunciation-character-basic": {
    id: "hsk1-pronunciation-character-basic",
    hskLevel: 1,
    badgeLabel: "HSK1 Foundation",
    badgeShort: "HSK1",
    requiredSections: [
      "lessonIntro",
      "pinyinPronunciation",
      "tones",
      "basicWords",
      "basicSentences",
      "dialogues",
      "characters",
      "workbookPronunciation",
      "workbookCharacters",
      "miniQuiz",
    ],
    optionalSections: ["culture", "modelTest"],
    requiresQuiz: true,
  },
  "hsk2-basic-dialogue-sentence": {
    id: "hsk2-basic-dialogue-sentence",
    hskLevel: 2,
    badgeLabel: "HSK2 Basic Dialogue",
    badgeShort: "HSK2",
    requiredSections: [
      "lessonIntro",
      "dialogues",
      "vocabulary",
      "grammarPatterns",
      "sentencePractice",
      "workbookListening",
      "workbookReading",
      "workbookPronunciation",
      "workbookCharacters",
      "quiz",
    ],
    optionalSections: ["modelTest", "culture"],
    requiresQuiz: true,
  },
  "hsk3-dialogue-reading-writing-review": {
    id: "hsk3-dialogue-reading-writing-review",
    hskLevel: 3,
    badgeLabel: "HSK3 Transition",
    badgeShort: "HSK3",
    requiredSections: [
      "lessonIntro",
      "texts",
      "vocabulary",
      "grammarNotes",
      "characters",
      "commonSaying",
      "culture",
      "workbookListening",
      "workbookReading",
      "workbookWriting",
      "workbookReview",
      "quiz",
    ],
    optionalSections: ["dialogues", "shortReadings"],
    requiresQuiz: true,
  },
  "hsk4-dialogue-shorttext-exam-workbook": {
    id: "hsk4-dialogue-shorttext-exam-workbook",
    hskLevel: 4,
    badgeLabel: "HSK4 Dialogue + Text",
    badgeShort: "HSK4",
    requiredSections: [
      "warmup",
      "texts",
      "vocabulary",
      "notes",
      "compare",
      "textComprehensionQuestions",
      "exercises",
      "expansion",
      "application",
      "culture",
      "workbookListening",
      "workbookReading",
      "workbookWriting",
      "quiz",
    ],
    optionalSections: [],
    requiresQuiz: true,
    recommendedTextCount: 5,
    recommendedTextTypes: ["dialogue", "dialogue", "dialogue", "short_text", "short_text"],
  },
  "hsk5-article-topic-vocab-nuance-writing": {
    id: "hsk5-article-topic-vocab-nuance-writing",
    hskLevel: 5,
    badgeLabel: "HSK5 Article",
    badgeShort: "HSK5",
    requiredSections: [
      "unit",
      "warmup",
      "mainText",
      "vocabulary",
      "wordExplanation",
      "collocations",
      "wordComparison",
      "textExercises",
      "expansionVocabulary",
      "applicationDiscussionOrWriting",
      "workbookListening",
      "workbookReading",
      "workbookWriting",
      "quiz",
    ],
    optionalSections: ["paragraphs"],
    requiresQuiz: true,
  },
  "hsk6-advanced-reading-output-summary": {
    id: "hsk6-advanced-reading-output-summary",
    hskLevel: 6,
    badgeLabel: "HSK6 Advanced",
    badgeShort: "HSK6",
    requiredSections: [
      "unit",
      "warmup",
      "longText",
      "vocabulary",
      "comprehensiveNotes",
      "wordComparison",
      "discourseRhetoric",
      "sentenceErrorAnalysis",
      "textExercises",
      "applicationSummaryWriting",
      "expansionVocabulary",
      "workbookListening",
      "workbookReading",
      "workbookSummaryWriting",
      "quiz",
    ],
    optionalSections: ["paragraphs", "summaryPrompt"],
    requiresQuiz: true,
  },
};

const PROFILE_BY_LEVEL: Record<HskLevel, HskLessonProfileId> = {
  1: "hsk1-pronunciation-character-basic",
  2: "hsk2-basic-dialogue-sentence",
  3: "hsk3-dialogue-reading-writing-review",
  4: "hsk4-dialogue-shorttext-exam-workbook",
  5: "hsk5-article-topic-vocab-nuance-writing",
  6: "hsk6-advanced-reading-output-summary",
};

export function isKnownHskProfile(value: string): value is HskLessonProfileId {
  return value in HSK_PROFILES;
}

export function inferProfileFromHskLevel(level: number): HskLessonProfileId | null {
  if (level >= 1 && level <= 6) {
    return PROFILE_BY_LEVEL[level as HskLevel];
  }
  return null;
}

export function getHskProfile(profileId: HskLessonProfileId): HskProfileDefinition {
  return HSK_PROFILES[profileId];
}

export function profileBadgeLabel(profileId: HskLessonProfileId): string {
  return HSK_PROFILES[profileId].badgeLabel;
}

/** Sections that satisfy vocabulary requirement across profiles. */
export const VOCABULARY_SECTION_ALIASES = [
  "vocabulary",
  "basicWords",
  "expansionVocabulary",
] as const;

/** Sections that satisfy quiz requirement across profiles. */
export const QUIZ_SECTION_ALIASES = ["quiz", "miniQuiz"] as const;
