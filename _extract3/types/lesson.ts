// types/lesson.ts
// Бөөндөө Сурцгаая — хичээлийн JSON-ийн TypeScript төрлүүд.
// Эдгээр нь lesson-01.json-ийн бодит бүтцэд яг таарч бичигдсэн.

export type ModuleKey =
  | "hook"
  | "vocabulary"
  | "dialogues"
  | "texts"
  | "pronunciation"
  | "grammar"
  | "exercises_textbook"
  | "exercises_workbook"
  | "recap";

export interface LocalizedTitle {
  zh: string;
  pinyin?: string;
  en?: string;
  mn: string;
}

export interface Theme {
  zh: string;
  mn: string;
}

export interface Hook {
  teacher_mn: string;
  warmup_mn?: string;
}

export interface VocabItem {
  id: number;
  zh: string;
  pinyin: string;
  pos?: string;          // "n.", "v.", "adj." ...
  mn: string;
  en?: string;
  example_zh?: string | null;
  example_pinyin?: string | null; // ирээдүйд нэмж болно
  example_mn?: string | null;     // ирээдүйд нэмж болно
  srs?: boolean;
  beyond_syllabus?: boolean;      // 超纲 (одооноос давсан үг)
}

export interface DialogueLine {
  speaker: string;
  zh: string;
  pinyin: string;
  mn: string;
}

export interface Dialogue {
  id: number;
  title_mn?: string;
  audio?: string;        // "textbook/hsk4A-textbook-0101.mp3"
  lines: DialogueLine[];
}

export interface ShortText {
  id: number;
  audio?: string;
  zh: string;
  pinyin: string;
  mn: string;
}

export interface GrammarExample {
  zh: string;
  pinyin: string;
  mn: string;
}

export interface GrammarPoint {
  point: string;         // "不仅……也／还……"
  gloss_mn: string;      // богино монгол утга
  teacher_mn: string;    // тайлбар (жам ёсны монголоор)
  examples: GrammarExample[];
}

// Хичээлийн бүх агуулгыг агуулсан үндсэн төрөл
export interface Lesson {
  schema_version: string;
  level: string;             // "HSK4A"
  lesson_number: number;
  title: LocalizedTitle;
  theme: Theme;
  audio_base_path?: string;  // "audio/"
  modules_enabled: ModuleKey[];
  hook: Hook;
  vocabulary: VocabItem[];
  proper_nouns?: { zh: string; pinyin: string; mn: string }[];
  dialogues?: Dialogue[];
  texts?: ShortText[];
  pronunciation?: unknown;   // дараа нарийн төрөлжүүлнэ
  grammar?: GrammarPoint[];
  exercises_textbook?: unknown;
  exercises_workbook?: unknown;
  recap?: unknown;
}
