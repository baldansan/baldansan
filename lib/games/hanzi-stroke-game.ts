import { shuffleArray } from "@/lib/games/game-data-core";
import {
  allCatalogComponents,
  allStrokeOrderDescriptions,
  buildComponentExplanation,
  collectLessonCharacters,
  formatStructureDetail,
  resolveHanziCharacterData,
  structureLabelMn,
  type HanziCharacterData,
} from "@/lib/games/hanzi-component-data";
import type { GameVocabItem, StrokeQuestion } from "@/lib/games/game-types";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";

type ComponentQuestionKind = "completion" | "reverse" | "meaning" | "structure";

function pickDistractors(
  pool: string[],
  correct: string,
  count: number
): string[] {
  const unique = [...new Set(pool.filter((v) => v && v !== correct))];
  return shuffleArray(unique).slice(0, count);
}

function lessonComponentPool(
  characterDataList: HanziCharacterData[]
): string[] {
  const pool = new Set<string>();
  for (const data of characterDataList) {
    for (const c of data.components) {
      pool.add(c.component);
    }
  }
  for (const c of allCatalogComponents()) {
    pool.add(c);
  }
  return [...pool];
}

function buildCompletionQuestion(
  data: HanziCharacterData,
  pool: string[],
  kind: ComponentQuestionKind
): StrokeQuestion | null {
  if (data.components.length < 2) return null;

  const [left, right] = data.components;
  const target =
    kind === "completion"
      ? { shown: left, missing: right, formula: `${left.component} + ? = ${data.character}` }
      : { shown: right, missing: left, formula: `? + ${right.component} = ${data.character}` };

  const options = shuffleArray([
    target.missing.component,
    ...pickDistractors(pool, target.missing.component, 3),
  ]);

  return {
    id: `${data.character}-${kind}`,
    chinese: data.character,
    pinyin: data.pinyin,
    mongolian: data.meaningMn,
    mode: "component",
    questionType: kind === "completion" ? "completion" : "reverse",
    formulaPrompt: target.formula,
    prompt: kind === "completion" ? "Дутуу бүрдэлийг сонго" : "Зүүн бүрдэлийг сонго",
    correctComponent: target.missing.component,
    options,
    explanation: buildComponentExplanation(data),
    structure: formatStructureDetail(data),
  };
}

function buildMeaningQuestion(
  data: HanziCharacterData,
  pool: HanziCharacterData[]
): StrokeQuestion | null {
  if (data.components.length < 2) return null;

  const target = data.components[0];
  const meaningPool = pool.flatMap((d) =>
    d.components.map((c) => c.meaningMn)
  );
  const options = shuffleArray([
    target.meaningMn,
    ...pickDistractors(meaningPool, target.meaningMn, 3),
  ]);

  return {
    id: `${data.character}-meaning`,
    chinese: data.character,
    pinyin: data.pinyin,
    mongolian: data.meaningMn,
    mode: "component",
    questionType: "meaning",
    formulaPrompt: `${data.character} дотор ${target.component} бүрдэл`,
    prompt: `${target.component} ямар утгатай вэ?`,
    correctComponent: target.meaningMn,
    options,
    explanation: buildComponentExplanation(data),
    structure: formatStructureDetail(data),
  };
}

function buildStructureQuestion(
  data: HanziCharacterData,
  pool: HanziCharacterData[]
): StrokeQuestion | null {
  if (data.components.length < 2) return null;

  const correct = formatStructureDetail(data);
  const wrongPool = pool
    .filter((d) => d.character !== data.character && d.components.length >= 2)
    .map((d) => formatStructureDetail(d));

  const genericWrong = [
    structureLabelMn("top-bottom"),
    structureLabelMn("surround"),
    structureLabelMn("stacked"),
  ].filter((label) => label !== correct);

  const options = shuffleArray([
    correct,
    ...pickDistractors([...wrongPool, ...genericWrong], correct, 3),
  ]);

  return {
    id: `${data.character}-structure`,
    chinese: data.character,
    pinyin: data.pinyin,
    mongolian: data.meaningMn,
    mode: "component",
    questionType: "structure",
    formulaPrompt: `${data.character} — 偏旁 бүтэц`,
    prompt: "Ханзны бүтэц аль вэ?",
    correctComponent: correct,
    options,
    explanation: buildComponentExplanation(data),
    structure: correct,
  };
}

function buildStrokeOrderQuestion(
  data: HanziCharacterData,
  descriptionPool: string[]
): StrokeQuestion | null {
  const correct = data.strokeOrderDescriptionMn;
  if (!correct) return null;

  const pool = [...new Set([...descriptionPool, ...allStrokeOrderDescriptions()])];
  const options = shuffleArray([
    correct,
    ...pickDistractors(pool, correct, 3),
  ]);

  return {
    id: `${data.character}-stroke-order`,
    chinese: data.character,
    pinyin: data.pinyin,
    mongolian: data.meaningMn,
    mode: "stroke-order",
    formulaPrompt: `${data.character} = ?`,
    prompt: "Зураасны дараалал",
    correctComponent: correct,
    options,
    explanation: `${data.character} (${data.pinyin}) — ${correct}.`,
  };
}

function generateQuestionsForCharacter(
  data: HanziCharacterData,
  allData: HanziCharacterData[],
  componentPool: string[],
  strokePool: string[]
): StrokeQuestion[] {
  if (data.components.length >= 2) {
    const questions: StrokeQuestion[] = [];
    const completion = buildCompletionQuestion(data, componentPool, "completion");
    const reverse = buildCompletionQuestion(data, componentPool, "reverse");
    const meaning = buildMeaningQuestion(data, allData);
    const structure = buildStructureQuestion(data, allData);

    if (completion) questions.push(completion);
    if (reverse) questions.push(reverse);
    if (meaning) questions.push(meaning);
    if (structure) questions.push(structure);

    return questions;
  }

  const strokeOrder = buildStrokeOrderQuestion(data, strokePool);
  return strokeOrder ? [strokeOrder] : [];
}

export function buildHanziStrokeGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6,
  characterNotes: HskCharacterNote[] = []
): StrokeQuestion[] {
  const chars = collectLessonCharacters(vocabulary);
  if (chars.length === 0) return [];

  const resolved = chars
    .map((char) => resolveHanziCharacterData(char, vocabulary, characterNotes))
    .filter((d): d is HanziCharacterData => d !== null);

  if (resolved.length === 0) return [];

  const componentPool = lessonComponentPool(resolved);
  const strokePool = resolved
    .map((d) => d.strokeOrderDescriptionMn)
    .filter((v): v is string => Boolean(v));

  const allQuestions = resolved.flatMap((data) =>
    generateQuestionsForCharacter(data, resolved, componentPool, strokePool)
  );

  if (allQuestions.length === 0) return [];

  const byCharacter = new Map<string, StrokeQuestion[]>();
  for (const q of allQuestions) {
    const list = byCharacter.get(q.chinese) ?? [];
    list.push(q);
    byCharacter.set(q.chinese, list);
  }

  const picked: StrokeQuestion[] = [];
  const charKeys = shuffleArray([...byCharacter.keys()]);

  while (picked.length < maxQuestions && charKeys.length > 0) {
    for (const char of [...charKeys]) {
      if (picked.length >= maxQuestions) break;
      const list = byCharacter.get(char);
      if (!list || list.length === 0) {
        charKeys.splice(charKeys.indexOf(char), 1);
        continue;
      }
      const next = list.shift();
      if (next) picked.push(next);
      if (!list.length) {
        charKeys.splice(charKeys.indexOf(char), 1);
      }
    }
    if (charKeys.length === 0) break;
  }

  return picked.slice(0, maxQuestions);
}
