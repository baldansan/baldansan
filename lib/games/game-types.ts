export type GameType =
  | "match"
  | "translate"
  | "missing-word"
  | "arrange"
  | "stroke"
  | "radical"
  | "radical-challenge"
  | "meaning";

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
  explanation?: string;
  structure?: string;
};
