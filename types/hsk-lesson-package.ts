// Gold Standard / ZIP lesson JSON schema (separate from app VocabularyWord types).

export type HskPackageModuleKey =
  | "hook"
  | "vocabulary"
  | "characters"
  | "dialogues"
  | "texts"
  | "pronunciation"
  | "grammar"
  | "exercises_textbook"
  | "exercises_workbook"
  | "recap";

export interface HskLocalizedTitle {
  zh: string;
  pinyin?: string;
  en?: string;
  mn: string;
}

export interface HskPackageTheme {
  zh: string;
  mn: string;
}

export interface HskPackageHook {
  teacher_mn: string;
  warmup_mn?: string;
}

/** Lesson hanzi row from optional characters.json (ref_characters enrichment). */
export interface HskCharacter {
  hanzi: string;
  pinyin: string[];
  strokeCount?: number;
  radical?: string;
  components?: {
    c: string;
    meaning_en?: string;
    meaning_mn?: string;
    icon?: string;
  }[];
  etymology_mn?: string;
  /** Legacy alias — prefer etymology_mn */
  etymologyMn?: string;
  readingLevel?: number;
  writingLevel?: number;
  practice: "write" | "recognize";
  frequency?: number;
  exampleWords?: string[];
  meaningEn?: string;
  meaningMn?: string;
}

/** Optional ref_words enrichment — all fields optional for legacy packages. */
export type HskVocabEnrichment = {
  radical?: string;
  frequency?: number;
  posAuto?: string[];
  classifiers?: string[];
  traditional?: string;
  hskOld?: string[];
  hskNew?: string[];
  hskNewest?: string[];
  meaningsEn?: string[];
  aboveHsk5Hint?: boolean;
  officialOldLevel?: string;
};

export interface HskPackageVocabItem extends HskVocabEnrichment {
  id: number;
  zh: string;
  pinyin: string;
  pos?: string;
  mn: string;
  en?: string;
  /** hsk_words / ref_words enrichment — preferred over mn/en when set */
  meaning_mn?: string | null;
  meaning_en?: string | null;
  example_zh?: string | null;
  example_pinyin?: string | null;
  example_mn?: string | null;
  srs?: boolean;
  beyond_syllabus?: boolean;
}

export interface HskPackageDialogueLine {
  speaker: string;
  zh: string;
  pinyin: string;
  mn: string;
  audio?: string;
}

export interface HskPackageDialogue {
  id: number;
  title_mn?: string;
  scene_mn?: string;
  audio?: string;
  lines: HskPackageDialogueLine[];
}

export interface HskPackageTextToken {
  zh: string;
  py: string;
}

export interface HskPackageTextSentence {
  zh: string;
  pinyin: string;
  tokens: HskPackageTextToken[];
  mn: string;
  note?: string;
  key_structures?: string[];
  /** true when JSON provided tokens[] — enables per-word tap in reader */
  word_tap?: boolean;
}

export interface HskPackageTextReflection {
  questions_mn?: string[];
}

export interface HskPackageParagraphSummary {
  paragraph: number;
  mn: string;
}

export interface HskPackageShortText {
  id: number;
  title_mn?: string;
  audio?: string;
  sentences: HskPackageTextSentence[];
  paragraph_summaries?: HskPackageParagraphSummary[];
  reflection?: HskPackageTextReflection;
  /** 写作 — model essay (~100 chars) for writing section. */
  writingSample?: HskPackageWritingSample;
}

export interface HskPackageWritingSample {
  title_mn?: string;
  zh: string;
  pinyin?: string;
  mn?: string;
}

export type HskGrammarExerciseType = "choice" | "fill" | "judge";

export interface HskPackageGrammarExercise {
  type: HskGrammarExerciseType;
  question: string;
  options?: string[];
  answer: string | number | boolean;
  explanation_correct_mn?: string;
  explanation_wrong_mn?: string;
}

export interface HskPackageGrammarExample {
  zh: string;
  pinyin: string;
  mn: string;
}

export interface HskPackageCollocationExample {
  zh: string;
  pinyin?: string;
  mn?: string;
}

export interface HskPackageCollocation {
  zh: string;
  mn?: string;
  usage_mn?: string;
  example?: HskPackageCollocationExample;
}

/** Optional teacher-overlay fields (grammar, wordExplanation, etc.). */
export interface HskTeacherCommonMistake {
  wrong: string;
  right: string;
  why?: string;
}

export interface HskTeacherCheckQuiz {
  question: string;
  options: string[];
  answer: string;
}

export interface HskTeacherOverlayFields {
  structure?: string;
  teacher_notes?: string;
  common_mistakes?: HskTeacherCommonMistake[];
  check?: HskTeacherCheckQuiz;
}

export interface HskPackageGrammarPoint extends HskTeacherOverlayFields {
  point: string;
  pinyin?: string;
  gloss_mn: string;
  teacher_mn: string;
  examples: HskPackageGrammarExample[];
  /** Per-point mini-exercises after examples. */
  exercises?: HskPackageGrammarExercise[];
}

export interface HskLessonPackage {
  schema_version: string;
  level: string;
  lesson_number: number;
  title: HskLocalizedTitle;
  theme: HskPackageTheme;
  audio_base_path?: string;
  modules_enabled: HskPackageModuleKey[];
  hook: HskPackageHook;
  vocabulary: HskPackageVocabItem[];
  characters?: {
    count: number;
    writeCount: number;
    characters: HskCharacter[];
  };
  proper_nouns?: { zh: string; pinyin: string; mn: string }[];
  dialogues?: HskPackageDialogue[];
  texts?: HskPackageShortText[];
  pronunciation?: unknown;
  grammar?: HskPackageGrammarPoint[];
  /** HSK5 wordExplanation items — same overlay UI as grammar when present. */
  word_explanation?: HskPackageGrammarPoint[];
  /** HSK5 词语搭配 — word collocations with expandable detail. */
  collocations?: HskPackageCollocation[];
  exercises_textbook?: unknown;
  exercises_workbook?: unknown;
  recap?: unknown;
}
