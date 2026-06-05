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
  components?: { c: string; meaning_en?: string; meaning_mn?: string }[];
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
}

export interface HskPackageShortText {
  id: number;
  audio?: string;
  sentences: HskPackageTextSentence[];
}

export interface HskPackageGrammarExample {
  zh: string;
  pinyin: string;
  mn: string;
}

export interface HskPackageGrammarPoint {
  point: string;
  gloss_mn: string;
  teacher_mn: string;
  examples: HskPackageGrammarExample[];
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
  exercises_textbook?: unknown;
  exercises_workbook?: unknown;
  recap?: unknown;
}
