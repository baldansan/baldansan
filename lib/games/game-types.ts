export type GameType =
  | "match"
  | "translate"
  | "missing-word"
  | "arrange"
  | "stroke";

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

export type StrokeQuestion = {
  id: string;
  chinese: string;
  pinyin: string;
  mongolian: string;
  prompt: string;
  correctComponent: string;
  options: string[];
  /** hangul = syllable construction; hanzi = Chinese stroke (default). */
  mode?: "hangul" | "hanzi";
};
