import { getPublicLessonById } from "@/lib/content";
import {
  prioritizePrelessonVocab,
  shuffleArray,
  toGameVocabItem,
} from "@/lib/games/game-data-core";
import {
  buildGameLessonContext,
  emptyGameLessonContext,
  type GameLessonContext,
} from "@/lib/games/game-lesson-meta";
import {
  buildHangulConstructionItems,
  buildKoreanArrangeItems,
  buildKoreanMissingWordItems,
  buildKoreanTranslateItems,
} from "@/lib/games/korean-game-data";
import { pickSameCategoryDistractors } from "@/lib/quiz/smart-options";
import { buildHanziStrokeGameItems } from "@/lib/games/hanzi-stroke-game";
import type {
  ArrangeQuestion,
  GameVocabItem,
  MatchPair,
  MissingWordQuestion,
  StrokeQuestion,
  TranslateQuestion,
} from "@/lib/games/game-types";

export { shuffleArray, toGameVocabItem } from "@/lib/games/game-data-core";
export type { GameLessonContext, GameLabels } from "@/lib/games/game-lesson-meta";
export { resolveGameLabels } from "@/lib/games/game-lesson-meta";

function withVocabPriority(
  context: Pick<GameLessonContext, "vocabulary" | "isPrelesson">
): GameVocabItem[] {
  return prioritizePrelessonVocab(context.vocabulary, context.isPrelesson);
}

export async function getLessonGameVocabulary(
  lessonId: string
): Promise<GameVocabItem[]> {
  const context = await getLessonGameContext(lessonId);
  return context.vocabulary;
}

export async function getLessonGameContext(
  lessonId: string
): Promise<GameLessonContext> {
  const lesson = await getPublicLessonById(lessonId);
  if (!lesson) {
    return emptyGameLessonContext();
  }
  return buildGameLessonContext(lesson);
}

/** Demo-only preview items for /games hub UI — not for saved progress. */
export function getGameFallbackItems(): GameVocabItem[] {
  return [
    {
      id: "demo-1",
      chinese: "你好",
      pinyin: "nǐ hǎo",
      mongolian: "Сайн байна уу",
      hskLevel: "HSK1",
      exampleChinese: "你好，很高兴认识你。",
      exampleMongolian: "Сайн байна уу, танилцахад таатай байна.",
    },
    {
      id: "demo-2",
      chinese: "学习",
      pinyin: "xuéxí",
      mongolian: "Сурах",
      hskLevel: "HSK2",
      exampleChinese: "我在学习中文。",
      exampleMongolian: "Би хятад хэл сурч байна.",
    },
    {
      id: "demo-3",
      chinese: "朋友",
      pinyin: "péngyou",
      mongolian: "Найз",
      hskLevel: "HSK2",
      exampleChinese: "他是我的好朋友。",
      exampleMongolian: "Тэр миний сайн найз.",
    },
    {
      id: "demo-4",
      chinese: "谢谢",
      pinyin: "xièxie",
      mongolian: "Баярлалаа",
      hskLevel: "HSK1",
      exampleChinese: "谢谢你的帮助。",
      exampleMongolian: "Туслалдлагад баярлалаа.",
    },
  ];
}

export function buildMatchGameItems(
  vocabulary: GameVocabItem[],
  maxPairs = 6,
  context?: Pick<GameLessonContext, "isPrelesson">
): MatchPair[] {
  const ordered = context
    ? prioritizePrelessonVocab(vocabulary, context.isPrelesson)
    : vocabulary;
  const usable = ordered.filter((w) => w.chinese && w.mongolian);
  if (usable.length < 4) return [];
  return shuffleArray(usable.slice(0, maxPairs)).map((w) => ({
    id: w.id,
    mongolian: w.mongolian,
    chinese: w.chinese,
    pinyin: w.pinyin,
  }));
}

function pickVocabDistractors(
  vocabulary: GameVocabItem[],
  target: GameVocabItem,
  count: number,
  field: "mongolian" | "chinese"
): string[] {
  return pickSameCategoryDistractors(vocabulary, target, count, field);
}


export function buildTranslateGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 10,
  context?: Pick<GameLessonContext, "isKorean" | "isPrelesson" | "vocabulary">
): TranslateQuestion[] {
  if (context?.isKorean) {
    return buildKoreanTranslateItems(
      withVocabPriority({
        vocabulary,
        isPrelesson: context.isPrelesson,
      }),
      maxQuestions
    );
  }

  const usable = vocabulary.filter((w) => w.chinese && w.mongolian);
  if (usable.length < 4) return [];
  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const distractors = pickVocabDistractors(usable, w, 3, "mongolian");
    return {
      id: w.id,
      chinese: w.chinese,
      pinyin: w.pinyin,
      correctAnswer: w.mongolian,
      options: shuffleArray([w.mongolian, ...distractors]),
    };
  });
}

export function buildMissingWordItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 8,
  context?: Pick<GameLessonContext, "isKorean" | "isPrelesson">
): MissingWordQuestion[] {
  if (context?.isKorean) {
    return buildKoreanMissingWordItems(
      withVocabPriority({
        vocabulary,
        isPrelesson: context.isPrelesson,
      }),
      maxQuestions
    );
  }

  const usable = vocabulary.filter(
    (w) =>
      w.chinese &&
      w.exampleChinese &&
      w.exampleChinese.includes(w.chinese)
  );
  if (usable.length === 0) return [];

  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const sentence = w.exampleChinese.replace(w.chinese, "＿＿＿");
    const distractors = pickVocabDistractors(usable, w, 3, "chinese");
    return {
      id: w.id,
      sentence,
      blankLabel: w.pinyin,
      correctAnswer: w.chinese,
      options: shuffleArray([w.chinese, ...distractors]),
      mongolianHint: w.exampleMongolian || w.mongolian,
    };
  });
}

export function splitChineseSentence(sentence: string): string[] {
  return [...sentence.replace(/\s/g, "")];
}

export function buildArrangeGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6,
  context?: Pick<GameLessonContext, "isKorean" | "isPrelesson">
): ArrangeQuestion[] {
  if (context?.isKorean) {
    return buildKoreanArrangeItems(
      withVocabPriority({
        vocabulary,
        isPrelesson: context.isPrelesson,
      }),
      maxQuestions
    );
  }

  const usable = vocabulary.filter(
    (w) => w.exampleChinese && w.exampleChinese.length >= 4
  );
  if (usable.length === 0) return [];

  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const target = w.exampleChinese.replace(/\s/g, "");
    const tiles = splitChineseSentence(target);
    return {
      id: w.id,
      target,
      tiles: shuffleArray(tiles),
      mongolianHint: w.exampleMongolian || w.mongolian,
    };
  });
}


export function buildStrokeGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6,
  context?: Pick<
    GameLessonContext,
    "isKorean" | "isPrelesson" | "hskCharacterNotes"
  >
): StrokeQuestion[] {
  if (context?.isKorean) {
    return buildHangulConstructionItems(
      withVocabPriority({
        vocabulary,
        isPrelesson: context.isPrelesson,
      }),
      maxQuestions
    );
  }

  return buildHanziStrokeGameItems(
    vocabulary,
    maxQuestions,
    context?.hskCharacterNotes ?? []
  );
}

export function hasEnoughVocabForMatch(vocabulary: GameVocabItem[]): boolean {
  return buildMatchGameItems(vocabulary).length >= 4;
}
