import type { HskCharacterNote } from "@/lib/lesson/hsk-lesson-content";
import type { GameVocabItem } from "@/lib/games/game-types";

export type HanziStructure =
  | "left-right"
  | "top-bottom"
  | "surround"
  | "stacked"
  | "single";

export type HanziComponent = {
  component: string;
  nameMn: string;
  meaningMn: string;
  position?: string;
};

export type HanziCharacterData = {
  character: string;
  pinyin: string;
  meaningMn: string;
  structure: HanziStructure;
  components: HanziComponent[];
  formula: string;
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

/** Lesson 1 single-component characters — stroke order only. */
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

/** Verified 偏旁 / component breakdowns for common HSK characters. */
const COMPONENT_CATALOG: Record<string, HanziCharacterData> = {
  休: {
    character: "休",
    pinyin: "xiū",
    meaningMn: "амрах",
    structure: "left-right",
    components: [
      {
        component: "亻",
        nameMn: "хүн radical",
        meaningMn: "хүн",
        position: "left",
      },
      {
        component: "木",
        nameMn: "мод",
        meaningMn: "мод",
        position: "right",
      },
    ],
    formula: "亻 + 木 = 休",
    mnemonicMn:
      "Хүн модны хажууд амарч байна гэж төсөөлж болно.",
  },
  你: {
    character: "你",
    pinyin: "nǐ",
    meaningMn: "чи, та",
    structure: "left-right",
    components: [
      {
        component: "亻",
        nameMn: "хүн radical",
        meaningMn: "хүн",
        position: "left",
      },
      {
        component: "尔",
        nameMn: "尔",
        meaningMn: "чам, та",
        position: "right",
      },
    ],
    formula: "亻 + 尔 = 你",
  },
  好: {
    character: "好",
    pinyin: "hǎo",
    meaningMn: "сайн",
    structure: "left-right",
    components: [
      {
        component: "女",
        nameMn: "эм",
        meaningMn: "эмэгтэй",
        position: "left",
      },
      {
        component: "子",
        nameMn: "хүүхэд",
        meaningMn: "хүүхэд",
        position: "right",
      },
    ],
    formula: "女 + 子 = 好",
    mnemonicMn: "Эм хүүхэдтэй бол «сайн» гэж бодож болно.",
  },
  谢: {
    character: "谢",
    pinyin: "xiè",
    meaningMn: "баярлах",
    structure: "left-right",
    components: [
      {
        component: "讠",
        nameMn: "яриа radical",
        meaningMn: "яриа, хэл",
        position: "left",
      },
      {
        component: "射",
        nameMn: "шидэх",
        meaningMn: "шидэх",
        position: "right",
      },
    ],
    formula: "讠 + 射 = 谢",
  },
  对: {
    character: "对",
    pinyin: "duì",
    meaningMn: "зөв, хариулт",
    structure: "left-right",
    components: [
      {
        component: "又",
        nameMn: "дахин",
        meaningMn: "дахин, гар",
        position: "left",
      },
      {
        component: "寸",
        nameMn: "цун",
        meaningMn: "хэмжээ",
        position: "right",
      },
    ],
    formula: "又 + 寸 = 对",
  },
  不: {
    character: "不",
    pinyin: "bù",
    meaningMn: "биш",
    structure: "single",
    components: [],
    formula: "不",
    strokeOrderDescriptionMn: "横 + 撇 + 竖 + 点",
  },
  没: {
    character: "没",
    pinyin: "méi",
    meaningMn: "байхгүй",
    structure: "left-right",
    components: [
      {
        component: "氵",
        nameMn: "ус radical",
        meaningMn: "ус",
        position: "left",
      },
      {
        component: "殳",
        nameMn: "殳",
        meaningMn: "зэвсэг",
        position: "right",
      },
    ],
    formula: "氵 + 殳 = 没",
  },
  关: {
    character: "关",
    pinyin: "guān",
    meaningMn: "холбоотой",
    structure: "top-bottom",
    components: [
      {
        component: "丷",
        nameMn: "八 variant",
        meaningMn: "дээд хэсэг",
        position: "top",
      },
      {
        component: "天",
        nameMn: "тэнгэр",
        meaningMn: "тэнгэр",
        position: "bottom",
      },
    ],
    formula: "丷 + 天 = 关",
  },
  系: {
    character: "系",
    pinyin: "xì",
    meaningMn: "холбоо",
    structure: "top-bottom",
    components: [
      {
        component: "丿",
        nameMn: "撇",
        meaningMn: "зураас",
        position: "top",
      },
      {
        component: "小",
        nameMn: "жижиг",
        meaningMn: "жижиг",
        position: "bottom",
      },
    ],
    formula: "丿 + 小 = 系",
  },
};

const ALL_CATALOG: Record<string, HanziCharacterData> = {
  ...STROKE_ORDER_CATALOG,
  ...COMPONENT_CATALOG,
};

export function structureLabelMn(structure: HanziStructure): string {
  return STRUCTURE_LABELS_MN[structure];
}

export function formatStructureDetail(data: HanziCharacterData): string {
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

export function resolveHanziCharacterData(
  character: string,
  vocabulary: GameVocabItem[],
  characterNotes: HskCharacterNote[] = [],
  extraCatalog: Record<string, HanziCharacterData> = {}
): HanziCharacterData | null {
  const char = character.trim();
  if (!char || char.length !== 1) return null;

  const fromNote = characterNotes.find((n) => n.chinese === char);
  if (fromNote) {
    const parsed = noteToCharacterData(fromNote);
    if (parsed) return parsed;
  }

  const builtIn = ALL_CATALOG[char];
  if (builtIn) {
    // Only override with vocabulary values when the vocabulary entry IS this
    // exact character — word-level pinyin/meaning (e.g. 你好) must never be
    // shown as the reading of a single glyph (好).
    const exactWord = vocabulary.find((w) => w.chinese.trim() === char);
    return {
      ...builtIn,
      pinyin: exactWord?.pinyin || builtIn.pinyin,
      meaningMn: exactWord?.mongolian || builtIn.meaningMn,
    };
  }

  const extra = extraCatalog[char];
  if (extra) return extra;

  return null;
}

export function collectLessonCharacters(vocabulary: GameVocabItem[]): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const word of vocabulary) {
    for (const char of word.chinese.replace(/\s/g, "")) {
      if (!/[\u4e00-\u9fff]/.test(char) || seen.has(char)) continue;
      seen.add(char);
      chars.push(char);
    }
  }
  return chars;
}

export function buildComponentExplanation(data: HanziCharacterData): string {
  if (data.components.length < 2) {
    return (
      data.strokeOrderDescriptionMn ??
      `${data.character} — ${data.meaningMn}`
    );
  }

  const componentParts = data.components
    .map((c) => `${c.component} нь ${c.meaningMn}`)
    .join(", ");
  let text = `${data.character} нь ${data.formula} гэсэн бүтэцтэй. ${componentParts}.`;
  if (data.mnemonicMn) {
    text += ` ${data.mnemonicMn}`;
  }
  return text;
}

export function allCatalogComponents(): string[] {
  const set = new Set<string>();
  for (const data of Object.values(ALL_CATALOG)) {
    for (const c of data.components) {
      set.add(c.component);
    }
  }
  return [...set];
}

export function allStrokeOrderDescriptions(): string[] {
  return Object.values(ALL_CATALOG)
    .map((d) => d.strokeOrderDescriptionMn)
    .filter((v): v is string => Boolean(v));
}
