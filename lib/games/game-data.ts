import { getPublicLessonById } from "@/lib/content";
import type { VocabularyWord } from "@/types/lesson";
import type {
  ArrangeQuestion,
  GameVocabItem,
  MatchPair,
  MissingWordQuestion,
  StrokeQuestion,
  TranslateQuestion,
} from "@/lib/games/game-types";

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function toGameVocabItem(word: VocabularyWord): GameVocabItem {
  return {
    id: word.id,
    chinese: word.chinese,
    pinyin: word.pinyin,
    mongolian: word.mongolian,
    hskLevel: word.hskLevel,
    exampleChinese: word.exampleChinese ?? "",
    exampleMongolian: word.exampleMongolian ?? "",
  };
}

export async function getLessonGameVocabulary(
  lessonId: string
): Promise<GameVocabItem[]> {
  const lesson = await getPublicLessonById(lessonId);
  if (!lesson) return [];
  return lesson.vocabulary.map(toGameVocabItem);
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
  maxPairs = 6
): MatchPair[] {
  const usable = vocabulary.filter((w) => w.chinese && w.mongolian);
  if (usable.length < 4) return [];
  return shuffleArray(usable.slice(0, maxPairs)).map((w) => ({
    id: w.id,
    mongolian: w.mongolian,
    chinese: w.chinese,
    pinyin: w.pinyin,
  }));
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number
): string[] {
  const others = shuffleArray(pool.filter((v) => v !== correct));
  return others.slice(0, count);
}

export function buildTranslateGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 10
): TranslateQuestion[] {
  const usable = vocabulary.filter((w) => w.chinese && w.mongolian);
  if (usable.length < 4) return [];
  const pool = usable.map((w) => w.mongolian);
  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const distractors = pickDistractors(pool, w.mongolian, 3);
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
  maxQuestions = 8
): MissingWordQuestion[] {
  const usable = vocabulary.filter(
    (w) =>
      w.chinese &&
      w.exampleChinese &&
      w.exampleChinese.includes(w.chinese)
  );
  if (usable.length === 0) return [];

  const pool = usable.map((w) => w.chinese);

  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const sentence = w.exampleChinese.replace(w.chinese, "＿＿＿");
    const distractors = pickDistractors(pool, w.chinese, 3);
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
  maxQuestions = 6
): ArrangeQuestion[] {
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

const STROKE_COMPONENTS = ["氵", "木", "口", "心", "女", "子", "人", "手", "日", "月"];

export function buildStrokeGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6
): StrokeQuestion[] {
  const usable = vocabulary.filter((w) => w.chinese && w.chinese.length >= 1);
  if (usable.length === 0) return [];

  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const char = [...w.chinese][0] ?? w.chinese;
    const correct =
      STROKE_COMPONENTS.find((c) => char.includes(c)) ??
      STROKE_COMPONENTS[0];
    const distractors = pickDistractors(STROKE_COMPONENTS, correct, 3);
    return {
      id: w.id,
      chinese: char,
      pinyin: w.pinyin,
      mongolian: w.mongolian,
      prompt: `${char} ханзны бүтэц`,
      correctComponent: correct,
      options: shuffleArray([correct, ...distractors]),
    };
  });
}

export function hasEnoughVocabForMatch(vocabulary: GameVocabItem[]): boolean {
  return buildMatchGameItems(vocabulary).length >= 4;
}
