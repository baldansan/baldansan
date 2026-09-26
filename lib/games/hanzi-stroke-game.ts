import { shuffleArray } from "@/lib/games/game-data-core";
import {
  allStrokeOrderDescriptions,
  buildComponentExplanation,
  collectLessonCharacters,
  DATASET_STRUCTURE_LABELS,
  formatStructureDetail,
  isMissingComponentEligible,
  isStrokeComponent,
  resolveHanziCharacterData,
  structureLabelMn,
  type HanziCharacterData,
  type HanziComponent,
  type HanziComponentKind,
} from "@/lib/games/hanzi-component-data";
import type {
  GameVocabItem,
  StrokeQuestion,
  StrokeQuestionPart,
} from "@/lib/games/game-types";
import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";

/** Basic single strokes — never offered as a "missing part" or distractor. */
const STROKE_GLYPHS = new Set([
  "一", "丨", "丶", "丿", "乀", "乙", "乚", "乛", "亅", "㇀", "㇇", "𠃌", "𠃍", "𡿨", "⺄", "㇉", "㇋", "㇌",
]);

type PoolPart = { glyph: string; kind: HanziComponentKind | "unknown" };

function pickDistractors(
  pool: string[],
  correct: string,
  count: number
): string[] {
  const unique = [...new Set(pool.filter((v) => v && v !== correct))];
  return shuffleArray(unique).slice(0, count);
}

/** All glyphs that make up `data` (first + second level) — never distractors. */
function ownGlyphs(data: HanziCharacterData): Set<string> {
  const set = new Set<string>([data.character]);
  for (const c of data.components) set.add(c.component);
  for (const [part, subs] of Object.entries(data.sub ?? {})) {
    set.add(part);
    for (const s of subs) set.add(s);
  }
  return set;
}

/** First-level parts of every lesson character (the distractor pool). */
function lessonPartPool(characterDataList: HanziCharacterData[]): PoolPart[] {
  const seen = new Map<string, PoolPart>();
  for (const data of characterDataList) {
    for (const c of data.components) {
      if (!seen.has(c.component)) {
        seen.set(c.component, { glyph: c.component, kind: c.kind ?? "unknown" });
      }
    }
  }
  return [...seen.values()];
}

/** Second-level parts — last-resort distractors when the lesson pool is small. */
function lessonSubPool(characterDataList: HanziCharacterData[]): string[] {
  const set = new Set<string>();
  for (const data of characterDataList) {
    for (const subs of Object.values(data.sub ?? {})) {
      for (const s of subs) set.add(s);
    }
  }
  return [...set];
}

function pickComponentDistractors(
  data: HanziCharacterData,
  missing: HanziComponent,
  pool: PoolPart[],
  subPool: string[],
  count: number
): string[] {
  const exclude = ownGlyphs(data);
  const candidates = pool.filter(
    (p) =>
      !exclude.has(p.glyph) &&
      p.kind !== "stroke" &&
      !STROKE_GLYPHS.has(p.glyph)
  );
  const sameKind = shuffleArray(
    candidates.filter((p) => p.kind === (missing.kind ?? "unknown"))
  ).map((p) => p.glyph);
  const otherKind = shuffleArray(
    candidates.filter((p) => p.kind !== (missing.kind ?? "unknown"))
  ).map((p) => p.glyph);

  const picked: string[] = [];
  for (const g of [...sameKind, ...otherKind]) {
    if (picked.length >= count) break;
    if (!picked.includes(g)) picked.push(g);
  }
  if (picked.length < count) {
    const known = new Set(pool.map((p) => p.glyph));
    for (const g of shuffleArray(subPool)) {
      if (picked.length >= count) break;
      if (exclude.has(g) || STROKE_GLYPHS.has(g) || picked.includes(g)) continue;
      // A sub-part that is a known stroke in the pool is skipped as well.
      if (known.has(g) && pool.find((p) => p.glyph === g)?.kind === "stroke") {
        continue;
      }
      picked.push(g);
    }
  }
  return picked;
}

function explanationFields(data: HanziCharacterData) {
  return {
    explanation: data.explanationMn ?? buildComponentExplanation(data),
    explanationZh: data.explanationZh,
    formula: data.components.length >= 2 ? data.formula : undefined,
    structure: formatStructureDetail(data),
    structureZh: data.structureLabelZh,
    charType: data.type,
  };
}

function buildParts(
  data: HanziCharacterData,
  hiddenIndex: number | null
): StrokeQuestionPart[] {
  return data.components.map((c, i) => {
    const hidden = i === hiddenIndex;
    return {
      glyph: hidden ? "?" : c.component,
      hidden: hidden || undefined,
      role: c.role,
      labelMn: hidden ? undefined : c.nameMn !== c.component ? c.nameMn : undefined,
      labelZh: hidden ? undefined : c.nameZh,
    };
  });
}

/**
 * Missing-component questions. The hidden part is always a non-stroke part;
 * the shown part(s) may be strokes. At most two per character.
 */
function buildMissingComponentQuestions(
  data: HanziCharacterData,
  pool: PoolPart[],
  subPool: string[]
): StrokeQuestion[] {
  if (!isMissingComponentEligible(data)) return [];

  const nonStrokeIdx = data.components
    .map((c, i) => (isStrokeComponent(c) || STROKE_GLYPHS.has(c.component) ? -1 : i))
    .filter((i) => i >= 0);
  if (nonStrokeIdx.length === 0) return [];

  const targets = [...new Set([nonStrokeIdx[nonStrokeIdx.length - 1]!, nonStrokeIdx[0]!])];
  const questions: StrokeQuestion[] = [];

  for (const idx of targets) {
    const missing = data.components[idx]!;
    const distractors = pickComponentDistractors(data, missing, pool, subPool, 3);
    if (distractors.length < 2) continue;

    const parts = buildParts(data, idx);
    const questionType = idx === 0 ? "reverse" : "completion";
    questions.push({
      id: `${data.character}-${questionType}-${idx}`,
      chinese: data.character,
      pinyin: data.pinyin,
      mongolian: data.meaningMn,
      mode: "component",
      questionType,
      formulaPrompt: `${parts.map((p) => p.glyph).join(" + ")} = ${data.character}`,
      parts,
      prompt: "Дутуу бүрдэлийг сонго",
      correctComponent: missing.component,
      options: shuffleArray([missing.component, ...distractors]),
      ...explanationFields(data),
    });
  }
  return questions;
}

function buildMeaningQuestion(
  data: HanziCharacterData,
  pool: HanziCharacterData[]
): StrokeQuestion | null {
  if (data.components.length < 2 || data.incomplete) return null;

  const target = data.components.find(
    (c) =>
      !isStrokeComponent(c) &&
      c.meaningMn &&
      c.meaningMn !== c.component
  );
  if (!target) return null;

  const ownMeanings = new Set(data.components.map((c) => c.meaningMn));
  const meaningPool = pool
    .filter((d) => d.character !== data.character)
    .flatMap((d) =>
      d.components
        .filter((c) => !isStrokeComponent(c) && c.meaningMn !== c.component)
        .map((c) => c.meaningMn)
    )
    .filter((m) => !ownMeanings.has(m));
  const distractors = pickDistractors(meaningPool, target.meaningMn, 3);
  if (distractors.length < 2) return null;

  return {
    id: `${data.character}-meaning`,
    chinese: data.character,
    pinyin: data.pinyin,
    mongolian: data.meaningMn,
    mode: "component",
    questionType: "meaning",
    formulaPrompt: target.component,
    prompt: "Энэ бүрдэл ямар утгатай вэ?",
    correctComponent: target.meaningMn,
    options: shuffleArray([target.meaningMn, ...distractors]),
    ...explanationFields(data),
  };
}

function buildStructureQuestion(
  data: HanziCharacterData,
  pool: HanziCharacterData[]
): StrokeQuestion | null {
  if (data.components.length < 2 || data.incomplete) return null;

  const correct = formatStructureDetail(data);
  const labelZh = new Map(DATASET_STRUCTURE_LABELS.map((l) => [l.mn, l.zh]));

  let options: string[];
  if (data.structureLabelMn) {
    const lessonLabels = pool
      .map((d) => d.structureLabelMn)
      .filter((l): l is string => Boolean(l) && l !== correct);
    const generic = DATASET_STRUCTURE_LABELS.map((l) => l.mn).filter(
      (l) => l !== correct && l !== "дан"
    );
    const wrong = [...new Set([...shuffleArray(lessonLabels), ...shuffleArray(generic)])].slice(0, 3);
    options = shuffleArray([correct, ...wrong]);
  } else {
    const wrongPool = pool
      .filter((d) => d.character !== data.character && d.components.length >= 2)
      .map((d) => formatStructureDetail(d));
    const genericWrong = [
      structureLabelMn("left-right"),
      structureLabelMn("top-bottom"),
      structureLabelMn("surround"),
      structureLabelMn("stacked"),
    ].filter((label) => label !== correct);
    options = shuffleArray([
      correct,
      ...pickDistractors([...wrongPool, ...genericWrong], correct, 3),
    ]);
  }

  const optionLabels: Record<string, { mn?: string; zh?: string }> = {};
  for (const o of options) {
    const zh = labelZh.get(o);
    if (zh) optionLabels[o] = { mn: o, zh };
  }

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
    optionLabels: Object.keys(optionLabels).length ? optionLabels : undefined,
    ...explanationFields(data),
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
    explanation: `${data.character}${data.pinyin ? ` (${data.pinyin})` : ""} — ${correct}.`,
  };
}

function generateQuestionsForCharacter(
  data: HanziCharacterData,
  allData: HanziCharacterData[],
  pool: PoolPart[],
  subPool: string[],
  strokePool: string[]
): StrokeQuestion[] {
  const questions: StrokeQuestion[] = [];
  const eligible = isMissingComponentEligible(data);

  if (!eligible && data.strokeOrderDescriptionMn) {
    const strokeOrder = buildStrokeOrderQuestion(data, strokePool);
    if (strokeOrder) questions.push(strokeOrder);
  }

  questions.push(...buildMissingComponentQuestions(data, pool, subPool));

  const meaning = buildMeaningQuestion(data, allData);
  if (meaning) questions.push(meaning);
  const structure = buildStructureQuestion(data, allData);
  if (structure) questions.push(structure);

  if (questions.length === 0 && data.strokeOrderDescriptionMn) {
    const strokeOrder = buildStrokeOrderQuestion(data, strokePool);
    if (strokeOrder) questions.push(strokeOrder);
  }
  return questions;
}

/** All questions per character, in priority order (no sampling). */
export function buildHanziStrokeQuestionsByCharacter(
  vocabulary: GameVocabItem[],
  characterNotes: HskCharacterNote[] = [],
  extraCatalog: Record<string, HanziCharacterData> = {}
): Map<string, StrokeQuestion[]> {
  const byCharacter = new Map<string, StrokeQuestion[]>();
  const chars = collectLessonCharacters(vocabulary);
  if (chars.length === 0) return byCharacter;

  const resolved = chars
    .map((char) =>
      resolveHanziCharacterData(char, vocabulary, characterNotes, extraCatalog)
    )
    .filter((d): d is HanziCharacterData => d !== null);
  if (resolved.length === 0) return byCharacter;

  const pool = lessonPartPool(resolved);
  const subPool = lessonSubPool(resolved);
  const strokePool = resolved
    .map((d) => d.strokeOrderDescriptionMn)
    .filter((v): v is string => Boolean(v));

  for (const data of resolved) {
    const list = generateQuestionsForCharacter(
      data,
      resolved,
      pool,
      subPool,
      strokePool
    );
    if (list.length > 0) byCharacter.set(data.character, list);
  }
  return byCharacter;
}

export function buildHanziStrokeGameItems(
  vocabulary: GameVocabItem[],
  maxQuestions = 6,
  characterNotes: HskCharacterNote[] = [],
  extraCatalog: Record<string, HanziCharacterData> = {}
): StrokeQuestion[] {
  const byCharacter = buildHanziStrokeQuestionsByCharacter(
    vocabulary,
    characterNotes,
    extraCatalog
  );
  if (byCharacter.size === 0) return [];

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
