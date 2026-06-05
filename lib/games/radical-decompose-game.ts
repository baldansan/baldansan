import { shuffleArray } from "@/lib/games/game-data-core";
import type { HskCharacter } from "@/types/hsk-lesson-package";

export type RadicalQuestionType = "meaning" | "assemble";

export type RadicalQuestion = {
  id: string;
  type: RadicalQuestionType;
  familyRadical: string;
  familyHanzi: string[];
  targetHanzi: string;
  targetPinyin: string;
  targetMeaning: string;
  formula: string;
  explanation: string;
  /** Meaning match — which component glyph is being tested. */
  promptComponent?: string;
  correctAnswer: string;
  options: string[];
  /** Assembly — correct left-to-right component order. */
  componentOrder?: string[];
  shuffledComponents?: string[];
};

function componentMeaning(
  row: NonNullable<HskCharacter["components"]>[number]
): string {
  return row.meaning_mn?.trim() || row.meaning_en?.trim() || row.c;
}

function pickDistractors(pool: string[], correct: string, count: number): string[] {
  const unique = [...new Set(pool.filter((v) => v && v !== correct))];
  return shuffleArray(unique).slice(0, count);
}

function resolveRadicalKey(char: HskCharacter): string {
  const radical = char.radical?.trim();
  if (radical) return radical;
  return char.components?.[0]?.c?.trim() || char.hanzi;
}

function usableCharacters(characters: HskCharacter[]): HskCharacter[] {
  return characters.filter((c) => (c.components?.length ?? 0) >= 2);
}

function groupCharactersByRadical(
  characters: HskCharacter[]
): Map<string, HskCharacter[]> {
  const groups = new Map<string, HskCharacter[]>();
  for (const char of characters) {
    const key = resolveRadicalKey(char);
    const list = groups.get(key) ?? [];
    list.push(char);
    groups.set(key, list);
  }
  return groups;
}

function buildMeaningQuestion(
  char: HskCharacter,
  familyRadical: string,
  familyHanzi: string[],
  meaningPool: string[]
): RadicalQuestion | null {
  const components = char.components ?? [];
  if (components.length < 2) return null;

  const target =
    components.find((c) => c.c === familyRadical) ?? components[0];
  const meaning = componentMeaning(target);
  const options = shuffleArray([
    meaning,
    ...pickDistractors(meaningPool, meaning, 3),
  ]);

  const parts = components.map((c) => c.c).join(" + ");

  return {
    id: `${char.hanzi}-meaning-${target.c}`,
    type: "meaning",
    familyRadical,
    familyHanzi,
    targetHanzi: char.hanzi,
    targetPinyin: char.pinyin.join(" "),
    targetMeaning: char.meaningMn?.trim() || char.hanzi,
    formula: `${parts} = ${char.hanzi}`,
    explanation: `${char.hanzi} (${char.pinyin.join(" ")}) — ${parts}. ${target.c} нь «${meaning}».`,
    promptComponent: target.c,
    correctAnswer: meaning,
    options,
  };
}

function buildAssembleQuestion(
  char: HskCharacter,
  familyRadical: string,
  familyHanzi: string[]
): RadicalQuestion | null {
  const components = char.components ?? [];
  if (components.length < 2) return null;

  const order = components.map((c) => c.c);
  const shuffledComponents = shuffleArray(order);

  return {
    id: `${char.hanzi}-assemble`,
    type: "assemble",
    familyRadical,
    familyHanzi,
    targetHanzi: char.hanzi,
    targetPinyin: char.pinyin.join(" "),
    targetMeaning: char.meaningMn?.trim() || char.hanzi,
    formula: `${order.join(" + ")} = ${char.hanzi}`,
    explanation: `${char.hanzi} нь ${order.join(" + ")} гэсэн бүрдэлтэй.`,
    correctAnswer: char.hanzi,
    options: [],
    componentOrder: order,
    shuffledComponents,
  };
}

/** Build radical-family rounds from lesson `characters[].components`. */
export function buildRadicalDecomposeGameItems(
  characters: HskCharacter[],
  maxQuestions = 8
): RadicalQuestion[] {
  const usable = usableCharacters(characters);
  if (usable.length === 0) return [];

  const meaningPool = usable.flatMap(
    (c) => (c.components ?? []).map(componentMeaning)
  );

  const groups = groupCharactersByRadical(usable);
  const familyEntries = shuffleArray(
    [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  );

  const questions: RadicalQuestion[] = [];

  for (const [radical, family] of familyEntries) {
    const familyHanzi = family.map((c) => c.hanzi);
    const shuffledFamily = shuffleArray(family);

    for (const char of shuffledFamily) {
      if (questions.length >= maxQuestions) break;

      const meaning = buildMeaningQuestion(
        char,
        radical,
        familyHanzi,
        meaningPool
      );
      if (meaning) questions.push(meaning);
      if (questions.length >= maxQuestions) break;

      const assemble = buildAssembleQuestion(char, radical, familyHanzi);
      if (assemble) questions.push(assemble);
    }

    if (questions.length >= maxQuestions) break;
  }

  return questions.slice(0, maxQuestions);
}

export function isNewRadicalFamily(
  questions: RadicalQuestion[],
  index: number
): boolean {
  if (index <= 0) return true;
  const prev = questions[index - 1];
  const current = questions[index];
  if (!prev || !current) return true;
  return prev.familyRadical !== current.familyRadical;
}
