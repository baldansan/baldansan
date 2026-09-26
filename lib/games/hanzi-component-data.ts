import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";
import type { GameVocabItem } from "@/lib/games/game-types";

export type HanziStructure =
  | "left-right"
  | "top-bottom"
  | "surround"
  | "stacked"
  | "single";

/** radical = 偏旁/部首, stroke = нэг зураас (丿, 一…), char = энгийн ханз. */
export type HanziComponentKind = "radical" | "stroke" | "other" | "char";

export type HanziCharType = "形声" | "会意" | "象形";

export type HanziComponent = {
  component: string;
  nameMn: string;
  meaningMn: string;
  /** Chinese name/meaning, e.g. 言字旁. */
  nameZh?: string;
  /** sem = утга заагч (形旁), pho = дуудлага заагч (声旁). */
  role?: "sem" | "pho";
  /** Pinyin of the phonetic (声旁) part. */
  phoneticPinyin?: string;
  kind?: HanziComponentKind;
  position?: string;
};

export type HanziCharacterData = {
  character: string;
  pinyin: string;
  meaningMn: string;
  structure: HanziStructure;
  /** Dataset structure label (mn), e.g. "зүүн–баруун". */
  structureLabelMn?: string;
  /** Dataset structure label (zh), e.g. "左右结构". */
  structureLabelZh?: string;
  components: HanziComponent[];
  /** e.g. "讠 + 射 = 谢" */
  formula: string;
  type?: HanziCharType;
  /** Dataset explanation (mn / zh). */
  explanationMn?: string;
  explanationZh?: string;
  /** 部首 glyph. */
  radical?: string;
  /** Second-level decomposition of a part, e.g. { 射: ["身", "寸"] }. */
  sub?: Record<string, string[]>;
  /** Dataset marks the decomposition incomplete (unknown part). */
  incomplete?: boolean;
  /** Stroke-order mode for single-component characters. */
  strokeOrderDescriptionMn?: string;
  /** Optional learner mnemonic shown after answering. */
  mnemonicMn?: string;
};

const STRUCTURE_LABELS_MN: Record<HanziStructure, string> = {
  "left-right": "Зүүн–баруун бүтэц",
  "top-bottom": "Дээр–доор бүтэц",
  surround: "Хүрээлсэн бүтэц",
  stacked: "Давхарласан бүтэц",
  single: "Ганц бүрдэл",
};

/**
 * Structure labels exactly as they appear in char_breakdown_full.json (s / sz).
 * Used as the option set of the "structure" question.
 */
export const DATASET_STRUCTURE_LABELS: { mn: string; zh: string }[] = [
  { mn: "зүүн–баруун", zh: "左右结构" },
  { mn: "дээд–доод", zh: "上下结构" },
  { mn: "зүүн–дунд–баруун", zh: "左中右结构" },
  { mn: "дээд–дунд–доод", zh: "上中下结构" },
  { mn: "бүтэн хүрээ", zh: "全包围结构" },
  { mn: "дээрээс хүрээлсэн", zh: "上三包围" },
  { mn: "доороос хүрээлсэн", zh: "下三包围" },
  { mn: "зүүнээс хүрээлсэн", zh: "左三包围" },
  { mn: "зүүн дээрээс хүрээлсэн", zh: "左上包围" },
  { mn: "баруун дээрээс хүрээлсэн", zh: "右上包围" },
  { mn: "зүүн доороос хүрээлсэн", zh: "左下包围" },
  { mn: "давхар", zh: "镶嵌结构" },
  { mn: "дан", zh: "独体结构" },
];

/**
 * Single-stroke / very simple characters — stroke-order question only.
 * (Decompositions always come from the dataset; this only adds the
 * stroke-order description.)
 */
const STROKE_ORDER_CATALOG: Record<string, HanziCharacterData> = {
  "一": {
    character: "一",
    pinyin: "yī",
    meaningMn: "нэг",
    structure: "single",
    components: [],
    formula: "一",
    strokeOrderDescriptionMn: "нэг хэвтээ зураас",
  },
  "二": {
    character: "二",
    pinyin: "èr",
    meaningMn: "хоёр",
    structure: "single",
    components: [],
    formula: "二",
    strokeOrderDescriptionMn: "хоёр хэвтээ зураас",
  },
  "三": {
    character: "三",
    pinyin: "sān",
    meaningMn: "гурван",
    structure: "single",
    components: [],
    formula: "三",
    strokeOrderDescriptionMn: "гурван хэвтээ зураас",
  },
  "十": {
    character: "十",
    pinyin: "shí",
    meaningMn: "арав",
    structure: "single",
    components: [],
    formula: "十",
    strokeOrderDescriptionMn: "хэвтээ + босоо зураас",
  },
  "八": {
    character: "八",
    pinyin: "bā",
    meaningMn: "найм",
    structure: "single",
    components: [],
    formula: "八",
    strokeOrderDescriptionMn: "зүүн шидэх + баруун доош зураас",
  },
  "六": {
    character: "六",
    pinyin: "liù",
    meaningMn: "зургаа",
    structure: "single",
    components: [],
    formula: "六",
    strokeOrderDescriptionMn: "цэг + хэвтээ + зүүн/баруун зураас",
  },
};

export function structureLabelMn(structure: HanziStructure): string {
  return STRUCTURE_LABELS_MN[structure];
}

export function formatStructureDetail(data: HanziCharacterData): string {
  if (data.structureLabelMn) return data.structureLabelMn;
  if (data.components.length < 2) return structureLabelMn(data.structure);
  const parts = data.components
    .filter((c) => c.position)
    .map((c) => {
      const pos =
        c.position === "left"
          ? "Зүүн"
          : c.position === "right"
            ? "Баруун"
            : c.position === "top"
              ? "Дээр"
              : c.position === "bottom"
                ? "Доор"
                : c.position;
      return `${pos}: ${c.component}`;
    });
  if (parts.length === 0) return structureLabelMn(data.structure);
  return `${structureLabelMn(data.structure)} (${parts.join(", ")})`;
}

function parseStructure(value: string | undefined): HanziStructure {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized.includes("left") ||
    normalized.includes("зүүн") ||
    normalized.includes("lr")
  ) {
    return "left-right";
  }
  if (normalized.includes("top") || normalized.includes("дээр")) {
    return "top-bottom";
  }
  if (normalized.includes("surround") || normalized.includes("хүрээ")) {
    return "surround";
  }
  if (normalized.includes("stack")) {
    return "stacked";
  }
  return "single";
}

/** Lesson-package note → data. Fallback only when the dataset has no entry. */
function noteToCharacterData(note: HskCharacterNote): HanziCharacterData | null {
  const character = note.chinese.trim();
  if (!character || character.length !== 1) return null;

  const packageComponents = note.components ?? [];
  if (packageComponents.length >= 2) {
    const components: HanziComponent[] = packageComponents.map((c) => ({
      component: c.component,
      nameMn: c.nameMn ?? c.component,
      meaningMn: c.meaningMn ?? c.nameMn ?? c.component,
      position: c.position,
    }));
    const formula =
      note.formula ??
      `${components.map((c) => c.component).join(" + ")} = ${character}`;
    return {
      character,
      pinyin: note.pinyin ?? "",
      meaningMn: note.mongolian ?? character,
      structure: parseStructure(note.structure),
      components,
      formula,
      strokeOrderDescriptionMn: note.strokeNote,
      mnemonicMn: note.mnemonic,
    };
  }

  if (note.strokeNote) {
    return {
      character,
      pinyin: note.pinyin ?? "",
      meaningMn: note.mongolian ?? character,
      structure: "single",
      components: [],
      formula: character,
      strokeOrderDescriptionMn: note.strokeNote,
      mnemonicMn: note.mnemonic,
    };
  }

  return null;
}

/**
 * Resolution order: dataset (`extraCatalog`, char_breakdown_full.json) →
 * lesson character note → stroke-order catalog. The dataset is the single
 * source for parts/structure; notes and the stroke catalog only add pinyin,
 * meaning and a stroke-order description.
 */
export function resolveHanziCharacterData(
  character: string,
  vocabulary: GameVocabItem[],
  characterNotes: HskCharacterNote[] = [],
  extraCatalog: Record<string, HanziCharacterData> = {}
): HanziCharacterData | null {
  const char = character.trim();
  if (!char || char.length !== 1) return null;

  const note = characterNotes.find((n) => n.chinese === char);
  const strokeEntry = STROKE_ORDER_CATALOG[char];
  // Only use vocabulary values when the vocabulary entry IS this exact
  // character — word-level pinyin/meaning (e.g. 你好) must never be shown as
  // the reading of a single glyph (好).
  const exactWord = vocabulary.find((w) => w.chinese.trim() === char);

  const extra = extraCatalog[char];
  if (extra) {
    return {
      ...extra,
      pinyin:
        extra.pinyin ||
        exactWord?.pinyin ||
        note?.pinyin ||
        strokeEntry?.pinyin ||
        "",
      meaningMn:
        extra.meaningMn ||
        exactWord?.mongolian ||
        note?.mongolian ||
        strokeEntry?.meaningMn ||
        "",
      strokeOrderDescriptionMn:
        extra.strokeOrderDescriptionMn ??
        note?.strokeNote ??
        strokeEntry?.strokeOrderDescriptionMn,
      mnemonicMn: extra.mnemonicMn ?? note?.mnemonic,
    };
  }

  if (note) {
    const parsed = noteToCharacterData(note);
    if (parsed) return parsed;
  }

  if (strokeEntry) {
    return {
      ...strokeEntry,
      pinyin: exactWord?.pinyin || strokeEntry.pinyin,
      meaningMn: exactWord?.mongolian || strokeEntry.meaningMn,
    };
  }

  return null;
}

export function collectLessonCharacters(vocabulary: GameVocabItem[]): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const word of vocabulary) {
    for (const char of word.chinese.replace(/\s/g, "")) {
      if (!/[一-鿿]/.test(char) || seen.has(char)) continue;
      seen.add(char);
      chars.push(char);
    }
  }
  return chars;
}

export function isStrokeComponent(c: HanziComponent): boolean {
  return c.kind === "stroke";
}

/**
 * "Missing component" eligibility: ≥2 first-level parts, complete
 * decomposition, not 象形, and at least one part that is not a single stroke.
 */
export function isMissingComponentEligible(data: HanziCharacterData): boolean {
  if (data.components.length < 2) return false;
  if (data.incomplete) return false;
  if (data.type === "象形") return false;
  return data.components.some((c) => !isStrokeComponent(c));
}

/**
 * Fallback explanation — used only when the dataset has no explanation
 * (e.g. data coming from a lesson-package note).
 */
export function buildComponentExplanation(data: HanziCharacterData): string {
  if (data.explanationMn) return data.explanationMn;
  if (data.components.length < 2) {
    return (
      data.strokeOrderDescriptionMn ??
      `${data.character} — ${data.meaningMn}`
    );
  }

  const componentParts = data.components
    .map((c) => `${c.component} — ${c.meaningMn}`)
    .join(", ");
  let text = `${data.formula}. ${componentParts}.`;
  if (data.mnemonicMn) {
    text += ` ${data.mnemonicMn}`;
  }
  return text;
}

export function allStrokeOrderDescriptions(): string[] {
  return Object.values(STROKE_ORDER_CATALOG)
    .map((d) => d.strokeOrderDescriptionMn)
    .filter((v): v is string => Boolean(v));
}
