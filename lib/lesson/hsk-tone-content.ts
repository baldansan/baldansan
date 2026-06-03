import type { HskGuidedStep } from "@/lib/lesson/hsk-guided-step";
import type { HskToneExample } from "@/lib/lesson/hsk-lesson-content";

/** Learner-facing Mongolian labels for tone sections. */
export const HSK_TONE_LEARNER_LABELS = {
  sectionTitle: "Хөг / Дууны өнгө",
  example: "Жишээ",
  motion: "Гарын хөдөлгөөн",
  howToSay: "Яаж хэлэх вэ?",
  handRepeat: "Гараар дагаж хэл",
  repeat: "Давтах",
  hint: "Зөвлөгөө",
  listenRepeat: "Сонсоод давт",
} as const;

export type HskToneItem = {
  nameMn: string;
  example: string;
  explanationMn: string;
  symbol?: string;
  motionMn?: string;
  howToSayMn?: string;
  learnerHintMn?: string;
  repeatMn?: string;
  toneNumber: number;
  motionSymbol: string;
};

const DEFAULT_TONE_EXAMPLES = ["mā", "má", "mǎ", "mà"] as const;
const DEFAULT_TONE_NAMES = [
  "1-р хөг",
  "2-р хөг",
  "3-р хөг",
  "4-р хөг",
] as const;
const DEFAULT_TONE_EXPLANATIONS = [
  "өндөр, тэгш",
  "дээшлэх",
  "доошлоод дээшлэх",
  "огцом буух",
] as const;

export const TONE_MOTION_SYMBOLS = ["→", "↗", "∨", "↘"] as const;

const TONE_OBJECT_KEYS = new Set([
  "nameMn",
  "symbol",
  "example",
  "explanationMn",
  "motionMn",
  "learnerHintMn",
  "howToSayMn",
  "motionSymbol",
  "toneNumber",
  "tone",
  "number",
  "label",
  "titleMn",
  "pinyin",
  "mongolian",
  "explanation",
  "motion",
  "howToSay",
  "learnerHint",
  "hintMn",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function symbolToMotion(value: string | undefined, toneNumber: number): string {
  if (value && /^[→↗↘∨↑↓]$/.test(value)) return value;
  return TONE_MOTION_SYMBOLS[toneNumber - 1] ?? "→";
}

function isFlatToneDefinition(record: Record<string, unknown>): boolean {
  for (const key of TONE_OBJECT_KEYS) {
    if (trim(record[key])) return true;
  }
  return false;
}

function isToneMapEntry(key: string, value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return /^\d+$/.test(key) || /^tone[\d_-]*/i.test(key);
}

export function parseHskToneItem(
  item: Record<string, unknown>,
  index = 0
): HskToneItem | null {
  const toneNumber =
    Number(item.toneNumber ?? item.tone ?? item.number ?? index + 1) ||
    index + 1;
  const slot = Math.min(Math.max(toneNumber, 1), 4) - 1;

  const nameMn =
    trim(item.nameMn) ||
    trim(item.label) ||
    trim(item.titleMn) ||
    trim(item.title) ||
    DEFAULT_TONE_NAMES[slot] ||
    `${toneNumber}-р хөг`;

  const example =
    trim(item.example) ||
    trim(item.pinyin) ||
    trim(item.word) ||
    trim(item.chinese) ||
    DEFAULT_TONE_EXAMPLES[slot] ||
    "";

  const explanationMn =
    trim(item.explanationMn) ||
    trim(item.explanation) ||
    trim(item.mongolian) ||
    trim(item.mn) ||
    trim(item.description) ||
    DEFAULT_TONE_EXPLANATIONS[slot] ||
    "";

  const symbol = trim(item.symbol) || undefined;
  const motionMn = trim(item.motionMn) || trim(item.motion) || undefined;
  const howToSayMn = trim(item.howToSayMn) || trim(item.howToSay) || undefined;
  const learnerHintMn =
    trim(item.learnerHintMn) ||
    trim(item.hintMn) ||
    trim(item.learnerHint) ||
    trim(item.hint) ||
    undefined;
  const repeatMn =
    trim(item.repeatMn) || trim(item.repeat) || trim(item.practiceMn) || undefined;
  const motionSymbol = symbolToMotion(
    trim(item.motionSymbol) || symbol,
    toneNumber
  );

  if (!nameMn && !example && !explanationMn) return null;

  return {
    nameMn,
    example,
    explanationMn,
    symbol,
    motionMn,
    howToSayMn,
    learnerHintMn,
    repeatMn,
    toneNumber,
    motionSymbol,
  };
}

export function parseHskToneItems(value: unknown): HskToneItem[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    const rows: HskToneItem[] = [];
    value.forEach((item, index) => {
      if (isRecord(item)) {
        const parsed = parseHskToneItem(item, index);
        if (parsed) rows.push(parsed);
        return;
      }
      if (typeof item === "string" && item.trim()) {
        rows.push({
          nameMn: DEFAULT_TONE_NAMES[index] ?? `${index + 1}-р хөг`,
          example: item.trim(),
          explanationMn: DEFAULT_TONE_EXPLANATIONS[index] ?? "",
          toneNumber: index + 1,
          motionSymbol: TONE_MOTION_SYMBOLS[index] ?? "→",
        });
        return;
      }
      rows.push(...parseHskToneItems(item));
    });
    return rows;
  }

  if (!isRecord(value)) return [];

  if (Array.isArray(value.items)) return parseHskToneItems(value.items);
  if (Array.isArray(value.tones)) return parseHskToneItems(value.tones);
  if (Array.isArray(value.examples)) return parseHskToneItems(value.examples);
  if (Array.isArray(value.rows)) return parseHskToneItems(value.rows);

  if (isFlatToneDefinition(value)) {
    const parsed = parseHskToneItem(value, 0);
    return parsed ? [parsed] : [];
  }

  const mapEntries = Object.entries(value).filter(([key, item]) =>
    isToneMapEntry(key, item)
  );
  if (mapEntries.length > 0) {
    return mapEntries
      .map(([key, item], index) => {
        const toneIndex = /^\d+$/.test(key) ? Number(key) - 1 : index;
        return parseHskToneItem(item as Record<string, unknown>, toneIndex);
      })
      .filter((item): item is HskToneItem => item !== null);
  }

  return [];
}

export function toHskToneExample(item: HskToneItem): HskToneExample {
  return {
    label: item.nameMn,
    example: item.example,
    pinyin: item.example,
    mongolian: item.explanationMn,
    symbol: item.symbol,
    motionMn: item.motionMn,
    howToSayMn: item.howToSayMn,
    learnerHintMn: item.learnerHintMn,
    motionSymbol: item.motionSymbol,
    toneNumber: item.toneNumber,
  };
}

export function parseHskToneExamples(value: unknown): HskToneExample[] {
  return parseHskToneItems(value).map(toHskToneExample);
}

export function resolveToneHowToSay(item: HskToneItem): string {
  return [item.explanationMn, item.motionMn, item.howToSayMn]
    .filter(Boolean)
    .join(" · ");
}

export function isToneProductionStep(sourceType: string | undefined): boolean {
  const key = (sourceType ?? "").toLowerCase().replace(/[_\s]+/g, "-");
  return key.includes("tone-production") || key.includes("toneproduction");
}

export function parseToneItemsFromGuidedStep(step: HskGuidedStep): HskToneItem[] {
  const fromItems = parseHskToneItems(step.items);
  if (fromItems.length > 0) return fromItems;

  const fromExamples = parseHskToneItems(
    step.examples.map((example, index) => ({
      nameMn: example.label,
      example: example.pinyin ?? example.chinese,
      explanationMn: example.mongolian,
      symbol: example.symbol,
      motionMn: example.motionMn,
      howToSayMn: example.howToSayMn,
      learnerHintMn: example.learnerHintMn,
      toneNumber: example.toneNumber ?? index + 1,
      motionSymbol: example.motionSymbol,
    }))
  );
  if (fromExamples.length > 0) return fromExamples;

  return [];
}

export function defaultHskToneItems(): HskToneItem[] {
  return DEFAULT_TONE_NAMES.map((nameMn, index) => ({
    nameMn,
    example: DEFAULT_TONE_EXAMPLES[index],
    explanationMn: DEFAULT_TONE_EXPLANATIONS[index],
    toneNumber: index + 1,
    motionSymbol: TONE_MOTION_SYMBOLS[index],
  }));
}
