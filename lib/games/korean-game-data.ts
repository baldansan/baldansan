import {
  isHangulSyllable,
  isSingleHangulJamo,
  shuffleArray,
  splitKoreanSyllables,
} from "@/lib/games/game-data-core";
import {
  categorizeVocabularyForTranslate,
  pickSameCategoryDistractors,
} from "@/lib/quiz/smart-options";
import type {
  ArrangeQuestion,
  GameVocabItem,
  MissingWordQuestion,
  StrokeQuestion,
  TranslateQuestion,
} from "@/lib/games/game-types";

const VOWEL_MN_PREFIX = "Солонгос үндсэн эгшиг:";

const VOWEL_ROMANIZATION = ["a", "eo", "o", "u", "eu", "i", "ae", "e", "ya", "yeo", "yo", "yu"];

const VOWEL_JAMO = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ", "ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅐ", "ㅔ"];

const CONSONANT_JAMO = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
  "ㄲ",
  "ㄸ",
  "ㅃ",
  "ㅆ",
  "ㅉ",
];

const HANGUL_CONSTRUCTION_DRILLS: Array<{
  id: string;
  prompt: string;
  equation: string;
  correct: string;
  options: string[];
  mongolian: string;
}> = [
  {
    id: "hc-1",
    prompt: "? + ㅏ = 아",
    equation: "ㅇ + ㅏ = 아",
    correct: "ㅇ",
    options: ["ㅇ", "ㄱ", "ㄴ", "ㅁ"],
    mongolian: "Эгшиг ㅏ-тай үе",
  },
  {
    id: "hc-2",
    prompt: "ㄱ + ? = 가",
    equation: "ㄱ + ㅏ = 가",
    correct: "ㅏ",
    options: ["ㅏ", "ㅓ", "ㅗ", "ㅜ"],
    mongolian: "ㄱ + эгшиг",
  },
  {
    id: "hc-3",
    prompt: "ㅎ + ㅏ + ? = 한",
    equation: "ㅎ + ㅏ + ㄴ = 한",
    correct: "ㄴ",
    options: ["ㄴ", "ㄹ", "ㅁ", "ㅂ"],
    mongolian: "받침 ㄴ",
  },
  {
    id: "hc-4",
    prompt: "ㄱ + ㅜ + ? = 국",
    equation: "ㄱ + ㅜ + ㄱ = 국",
    correct: "ㄱ",
    options: ["ㄱ", "ㅋ", "ㄲ", "ㄴ"],
    mongolian: "받침 ㄱ",
  },
  {
    id: "hc-5",
    prompt: "? + ㅓ = 어",
    equation: "ㅇ + ㅓ = 어",
    correct: "ㅇ",
    options: ["ㅇ", "ㄷ", "ㅈ", "ㅎ"],
    mongolian: "Эгшиг ㅓ",
  },
  {
    id: "hc-6",
    prompt: "ㅎ + ? + ㄴ = 한",
    equation: "ㅎ + ㅏ + ㄴ = 한",
    correct: "ㅏ",
    options: ["ㅏ", "ㅓ", "ㅗ", "ㅡ"],
    mongolian: "Эгшиг ㅏ",
  },
];

const KOREAN_ARRANGE_TARGETS = [
  { target: "한글", hint: "Солонгос бичиг" },
  { target: "한국", hint: "Солонгос улс" },
  { target: "몽골", hint: "Монгол" },
  { target: "학생", hint: "Оюутан" },
  { target: "선생", hint: "Багш" },
  { target: "사람", hint: "Хүн" },
];

const KOREAN_MISSING_DRILLS = [
  {
    id: "mw-hangul",
    sentence: "__을 읽어요.",
    answer: "한글",
    hint: "Солонгос бичиг унших",
    category: "word" as const,
  },
  {
    id: "mw-mongol",
    sentence: "저는 __ 사람입니다.",
    answer: "몽골",
    hint: "Би монгол хүн",
    category: "country" as const,
  },
  {
    id: "mw-student",
    sentence: "저는 __ 입니다.",
    answer: "학생",
    hint: "Би оюутан",
    category: "profession" as const,
  },
  {
    id: "mw-korea",
    sentence: "저는 __ 사람입니다.",
    answer: "한국",
    hint: "Би солонгос хүн",
    category: "country" as const,
  },
];

export function formatKoreanVowelAnswer(
  word: Pick<GameVocabItem, "pinyin" | "mongolian">
): string {
  const reading = word.pinyin.trim();
  if (word.mongolian.includes(VOWEL_MN_PREFIX)) {
    return word.mongolian.trim();
  }
  if (reading) {
    return `${VOWEL_MN_PREFIX} ${reading} авиа`;
  }
  const fromMn = word.mongolian.match(/«([^»]+)»/);
  if (fromMn?.[1]) {
    return `${VOWEL_MN_PREFIX} ${fromMn[1]} авиа`;
  }
  return word.mongolian.trim();
}

function pickVocabDistractors(
  vocabulary: GameVocabItem[],
  target: GameVocabItem,
  count: number,
  field: "mongolian" | "chinese"
): string[] {
  return pickSameCategoryDistractors(vocabulary, target, count, field);
}

function pickFormattedVowelDistractors(
  vocabulary: GameVocabItem[],
  target: GameVocabItem,
  count: number
): string[] {
  const correct = formatKoreanVowelAnswer(target);
  const pool = vocabulary
    .filter((w) => categorizeVocabularyForTranslate(w) === "hangul_vowel")
    .map((w) => formatKoreanVowelAnswer(w));
  return pickFromPool(pool, correct, count);
}

function pickFromPool(pool: string[], correct: string, count: number): string[] {
  const correctKey = correct.trim().toLowerCase();
  const others = shuffleArray(
    pool.filter((v) => v.trim().toLowerCase() !== correctKey)
  );
  return others.slice(0, count);
}

export function buildKoreanTranslateItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 10
): TranslateQuestion[] {
  const usable = vocabulary.filter((w) => w.chinese && w.mongolian);
  if (usable.length < 4) return [];

  return shuffleArray(usable.slice(0, maxQuestions)).map((w) => {
    const isVowel =
      isSingleHangulJamo(w.chinese) ||
      categorizeVocabularyForTranslate(w) === "hangul_vowel";
    const correctAnswer = isVowel
      ? formatKoreanVowelAnswer(w)
      : w.mongolian.trim();
    const distractors = isVowel
      ? pickFormattedVowelDistractors(usable, w, 3)
      : pickVocabDistractors(usable, w, 3, "mongolian");

    return {
      id: w.id,
      chinese: w.chinese,
      pinyin: w.pinyin,
      correctAnswer,
      options: shuffleArray([correctAnswer, ...distractors]),
    };
  });
}

export function buildKoreanArrangeItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6
): ArrangeQuestion[] {
  const fromVocab = vocabulary
    .filter((w) => {
      const target =
        w.exampleChinese && isHangulSyllable(w.exampleChinese.replace(/\s/g, ""))
          ? w.exampleChinese.replace(/\s/g, "")
          : isHangulSyllable(w.chinese)
            ? w.chinese
            : "";
      const syllables = splitKoreanSyllables(target);
      return syllables.length >= 2 && syllables.length <= 4;
    })
    .map((w) => {
      const target =
        w.exampleChinese && isHangulSyllable(w.exampleChinese.replace(/\s/g, ""))
          ? w.exampleChinese.replace(/\s/g, "")
          : w.chinese;
      return {
        id: w.id,
        target,
        tiles: shuffleArray(splitKoreanSyllables(target)),
        mongolianHint: w.exampleMongolian || w.mongolian,
      };
    });

  const staticDrills = KOREAN_ARRANGE_TARGETS.map((item) => ({
    id: `arr-${item.target}`,
    target: item.target,
    tiles: shuffleArray(splitKoreanSyllables(item.target)),
    mongolianHint: item.hint,
  }));

  const merged = [...fromVocab, ...staticDrills];
  const unique = merged.filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.target === item.target) === index
  );

  return shuffleArray(unique).slice(0, maxQuestions);
}

export function buildKoreanMissingWordItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 8
): MissingWordQuestion[] {
  const usable = vocabulary.filter((w) => w.chinese);
  if (usable.length === 0) return [];

  const fromExamples = usable
    .filter(
      (w) =>
        w.exampleChinese &&
        w.exampleChinese.includes(w.chinese) &&
        /[가-힣]/.test(w.exampleChinese)
    )
    .map((w) => ({
      id: w.id,
      sentence: w.exampleChinese.replace(w.chinese, "__"),
      blankLabel: w.pinyin,
      correctAnswer: w.chinese,
      options: shuffleArray([
        w.chinese,
        ...pickVocabDistractors(usable, w, 3, "chinese"),
      ]),
      mongolianHint: w.exampleMongolian || w.mongolian,
    }));

  const templateDrills = KOREAN_MISSING_DRILLS.map((drill) => {
    const pool = usable.filter((w) => w.chinese !== drill.answer);
    const fakeTarget: GameVocabItem = {
      id: drill.id,
      chinese: drill.answer,
      pinyin: "",
      mongolian: drill.hint,
      hskLevel: "KR1",
      exampleChinese: drill.sentence.replace("__", drill.answer),
      exampleMongolian: drill.hint,
    };
    return {
      id: drill.id,
      sentence: drill.sentence,
      blankLabel: drill.hint,
      correctAnswer: drill.answer,
      options: shuffleArray([
        drill.answer,
        ...pickVocabDistractors(
          [
            ...pool,
            ...KOREAN_MISSING_DRILLS.map((d) => ({
              id: d.id,
              chinese: d.answer,
              pinyin: "",
              mongolian: d.hint,
              hskLevel: "KR1",
              exampleChinese: "",
              exampleMongolian: "",
            })),
          ],
          fakeTarget,
          3,
          "chinese"
        ),
      ]),
      mongolianHint: drill.hint,
    };
  });

  const merged = [...templateDrills, ...fromExamples];
  const unique = merged.filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.sentence === item.sentence) === index
  );

  return shuffleArray(unique).slice(0, maxQuestions);
}

export function buildHangulConstructionItems(
  _vocabulary: GameVocabItem[],
  maxQuestions = 6
): StrokeQuestion[] {
  return shuffleArray(HANGUL_CONSTRUCTION_DRILLS)
    .slice(0, maxQuestions)
    .map((drill) => ({
      id: drill.id,
      chinese: drill.equation,
      pinyin: "",
      mongolian: drill.mongolian,
      prompt: drill.prompt,
      correctComponent: drill.correct,
      options: shuffleArray(drill.options),
      mode: "hangul" as const,
    }));
}

export function buildKoreanMatchPool(vocabulary: GameVocabItem[]): GameVocabItem[] {
  return vocabulary.filter((w) => w.chinese && w.mongolian);
}

/** Syllable romanization contrast items for prelesson «Андуурдаг авиа». */
export function buildKoreanSoundContrastItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 8
): TranslateQuestion[] {
  const jamoItems = vocabulary.filter((w) => isSingleHangulJamo(w.chinese));
  if (jamoItems.length < 4) {
    return buildKoreanTranslateItems(vocabulary, maxQuestions);
  }

  return shuffleArray(jamoItems.slice(0, maxQuestions)).map((w) => {
    const correctAnswer = w.pinyin.trim() || w.chinese;
    const pool = jamoItems
      .map((item) => item.pinyin.trim())
      .filter(Boolean);
    const distractors = pickFromPool(pool, correctAnswer, 3);

    return {
      id: `${w.id}-sound`,
      chinese: w.chinese,
      pinyin: w.pinyin,
      correctAnswer,
      options: shuffleArray([correctAnswer, ...distractors]),
    };
  });
}

export { VOWEL_JAMO, VOWEL_ROMANIZATION, CONSONANT_JAMO };
