export type GameType =
  | "match"
  | "translate"
  | "missing-word"
  | "arrange"
  | "stroke"
  | "radical"
  | "radical-challenge"
  | "meaning"
  | "word-recall"
  | "pinyin-pick"
  | "example-cloze"
  | "radical-pick"
  | "srs-marathon"
  | "daily-challenge"
  | "speed-challenge"
  | "hsk-vocab-quiz"
  | "dictation";

export type GameVocabItem = {
  id: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  hskLevel: string;
  exampleChinese: string;
  exampleMongolian: string;
};

export type MatchPair = {
  id: string;
  mongolian: string;
  chinese: string;
  pinyin: string;
};

export type TranslateQuestion = {
  id: string;
  chinese: string;
  pinyin: string;
  correctAnswer: string;
  options: string[];
};

export type MissingWordQuestion = {
  id: string;
  sentence: string;
  blankLabel: string;
  correctAnswer: string;
  options: string[];
  mongolianHint: string;
};

export type ArrangeQuestion = {
  id: string;
  target: string;
  tiles: string[];
  mongolianHint: string;
};

export type StrokeQuestionMode = "hangul" | "component" | "stroke-order";

export type ComponentQuestionType =
  | "completion"
  | "reverse"
  | "meaning"
  | "structure";

/** One part shown in the question card formula (hidden = the "?" slot). */
export type StrokeQuestionPart = {
  glyph: string;
  hidden?: boolean;
  /** sem = утга заагч / 形旁, pho = дуудлага заагч / 声旁. */
  role?: "sem" | "pho";
  labelMn?: string;
  labelZh?: string;
};

export type StrokeQuestion = {
  id: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  prompt: string;
  correctComponent: string;
  options: string[];
  /** hangul = Korean syllable construction; component = 偏旁; stroke-order = зураасны дараалал. */
  mode?: StrokeQuestionMode;
  questionType?: ComponentQuestionType;
  /** e.g. 亻 + ? = 休 */
  formulaPrompt?: string;
  /** Structured formula for the question card (role tags, labels). */
  parts?: StrokeQuestionPart[];
  /** 形声 / 会意 / 象形 badge. */
  charType?: "形声" | "会意" | "象形";
  /** Mongolian explanation (dataset `e`, or a fallback sentence). */
  explanation?: string;
  /** Chinese explanation (dataset `ez`). */
  explanationZh?: string;
  /** Full formula line shown after answering, e.g. "讠 + 射 = 谢". */
  formula?: string;
  /** Structure label (mn). */
  structure?: string;
  /** Structure label (zh). */
  structureZh?: string;
  /** Per-option display labels (content) — option value stays the key. */
  optionLabels?: Record<string, { mn?: string; zh?: string }>;
};
