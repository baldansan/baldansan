import { formatLearnerTeacherNote } from "@/lib/lesson/format-learner-teacher-note";
import {
  parseHskToneItems,
  toHskToneExample,
} from "@/lib/lesson/hsk-tone-content";

export type HskGuidedStepKind =
  | "teacher-intro"
  | "key-phrase"
  | "phrase-breakdown"
  | "pinyin"
  | "tones"
  | "tone-sandhi"
  | "vocabulary"
  | "dialogue"
  | "common-mistake"
  | "characters"
  | "practice-menu"
  | "complete"
  | "content";

export type HskGuidedStep = {
  id: string;
  type: HskGuidedStepKind;
  titleMn: string;
  teacherSpeechMn: string;
  bulletsMn: string[];
  chinese: string;
  pinyin: string;
  mongolian: string;
  examples: HskGuidedStepExample[];
  /** Gold Standard media.json image id for this step. */
  imageId: string;
  mediaSection: string;
  /** Original package step type (e.g. tone_production) — admin/debug only. */
  sourceType: string;
  /** tone_production uses compact cards; standard tone steps use detail cards. */
  toneLayout: "production" | "standard";
  items: unknown[];
};

export type HskGuidedStepExample = {
  chinese?: string;
  pinyin?: string;
  mongolian?: string;
  label?: string;
  wrong?: string;
  correct?: string;
  symbol?: string;
  motionMn?: string;
  howToSayMn?: string;
  learnerHintMn?: string;
  motionSymbol?: string;
  toneNumber?: number;
};

const RAW_KEY_PATTERN =
  /^(id|type|titlemn|titlechinese|teacherspeechmn|practicemn|itemmn|sourceref|metadata|sectionkey|sectionid|imageid|role)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function looksLikeRawKey(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (RAW_KEY_PATTERN.test(t)) return true;
  if (/^(ID|TYPE|TITLEMN|TEACHERSPEECHMN):/i.test(t)) return true;
  return false;
}

/** Pick learner-facing Mongolian copy from Gold Standard step payloads. */
export function pickLearnerMnText(record: unknown): string {
  if (typeof record === "string") {
    const text = record.trim();
    return looksLikeRawKey(text) ? "" : text;
  }
  if (!isRecord(record)) return "";

  const candidates = [
    record.titleMn,
    record.teacherSpeechMn,
    record.practiceMn,
    record.bodyMn,
    record.speechMn,
    record.textMn,
    record.mongolian,
    record.mn,
    record.title,
    record.text,
    record.description,
    record.content,
    record.summary,
    record.body,
  ];

  for (const value of candidates) {
    const text = trim(value);
    if (text && !looksLikeRawKey(text)) return text;
  }
  return "";
}

function normalizeStepKind(raw: unknown): HskGuidedStepKind {
  const key = trim(raw).toLowerCase().replace(/[_\s]+/g, "-");
  if (
    key.includes("teacher") ||
    key.includes("intro") ||
    key === "lessonintro"
  ) {
    return "teacher-intro";
  }
  if (key.includes("phrase-breakdown") || key === "phrasebreakdown") {
    return "phrase-breakdown";
  }
  if (key.includes("key-phrase") || key === "phrase" || key === "herophrase") {
    return "key-phrase";
  }
  if (key.includes("pinyin") || key.includes("pronunciation")) {
    return "pinyin";
  }
  if (key.includes("tone-sandhi") || key.includes("tonesandhi") || key === "tone_sandhi") {
    return "tone-sandhi";
  }
  if (key.includes("tone")) return "tones";
  if (key.includes("vocab") || key.includes("word") || key === "basicwords") {
    return "vocabulary";
  }
  if (key.includes("dialogue")) return "dialogue";
  if (
    key.includes("mistake") ||
    key.includes("common-mistake") ||
    key === "correction"
  ) {
    return "common-mistake";
  }
  if (key.includes("character") || key.includes("hanzi")) return "characters";
  if (key.includes("practice-menu") || key === "practice") {
    return "practice-menu";
  }
  if (key.includes("complete") || key.includes("summary") || key === "finish") {
    return "complete";
  }
  return "content";
}

function toneItemToExample(
  tone: ReturnType<typeof parseHskToneItems>[number]
): HskGuidedStepExample {
  const mapped = toHskToneExample(tone);
  return {
    label: mapped.label,
    chinese: mapped.example,
    pinyin: mapped.pinyin,
    mongolian: mapped.mongolian,
    symbol: mapped.symbol,
    motionMn: mapped.motionMn,
    howToSayMn: mapped.howToSayMn,
    learnerHintMn: mapped.learnerHintMn,
    motionSymbol: mapped.motionSymbol,
    toneNumber: mapped.toneNumber,
  };
}

function parseExamples(raw: unknown): HskGuidedStepExample[] {
  const toneItems = parseHskToneItems(raw);
  if (toneItems.length > 0) {
    return toneItems.map(toneItemToExample);
  }

  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): HskGuidedStepExample | null => {
      if (typeof item === "string") {
        const text = item.trim();
        if (!text || looksLikeRawKey(text)) return null;
        return { mongolian: text };
      }
      if (!isRecord(item)) return null;
      const chinese =
        trim(item.chinese) || trim(item.titleChinese) || trim(item.word);
      const pinyin = trim(item.pinyin) || trim(item.reading);
      const mongolian =
        pickLearnerMnText(item) ||
        trim(item.exampleMn) ||
        trim(item.meaningMn);
      const label = trim(item.label) || trim(item.titleMn);
      const wrong =
        trim(item.wrong) ||
        trim(item.incorrect) ||
        trim(item.wrongPinyin) ||
        trim(item.incorrectPinyin);
      const correct =
        trim(item.correct) ||
        trim(item.correctPinyin) ||
        trim(item.rightPinyin);
      if (!chinese && !pinyin && !mongolian && !wrong && !correct) return null;
      return {
        chinese: chinese || undefined,
        pinyin: pinyin || undefined,
        mongolian: mongolian || undefined,
        label: label || undefined,
        wrong: wrong || undefined,
        correct: correct || undefined,
      };
    })
    .filter((item): item is HskGuidedStepExample => item !== null);
}

function parseBullets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        return looksLikeRawKey(text) ? "" : text;
      }
      return pickLearnerMnText(item);
    })
    .filter(Boolean);
}

function normalizeGuidedStep(raw: unknown, index: number): HskGuidedStep | null {
  if (!isRecord(raw)) return null;

  const id = trim(raw.id) || trim(raw.key) || `step-${index + 1}`;
  const sourceType = trim(raw.type ?? raw.stepType ?? raw.sectionType ?? id);
  const type = normalizeStepKind(sourceType);
  const toneLayout =
    sourceType.toLowerCase().replace(/[_\s]+/g, "-").includes("tone-production")
      ? "production"
      : "standard";

  const teacherSpeech =
    formatLearnerTeacherNote(raw) ||
    pickLearnerMnText(raw.teacherNote ?? raw.teacher) ||
    "";

  const titleMn =
    pickLearnerMnText({ titleMn: raw.titleMn, title: raw.title }) ||
    (type === "teacher-intro"
      ? "Багшийн тайлбар"
      : type === "pinyin"
        ? "Пиньинь"
        : type === "tones"
          ? "Хөг / Дууны өнгө"
          : type === "tone-sandhi"
            ? "Хөгийн өөрчлөлт"
            : type === "phrase-breakdown"
              ? "Үгийн бүтэц"
              : type === "key-phrase"
            ? "Гол хэллэг"
            : type === "vocabulary"
              ? "Үгийн сан"
              : type === "dialogue"
                ? "Ярианы дасгал"
                : type === "common-mistake"
                  ? "Түгээмэл алдаа"
                  : type === "characters"
                    ? "Ханз"
                    : type === "practice-menu"
                    ? "Дасгал"
                    : type === "complete"
                      ? "Дууслаа"
                      : "Хичээл");

  const bulletsMn = parseBullets(
    raw.bulletsMn ?? raw.bullets ?? raw.points ?? raw.objectives
  );

  const speechText = teacherSpeech || pickLearnerMnText(raw);
  const allBullets =
    bulletsMn.length > 0
      ? bulletsMn
      : speechText
        ? speechText.split(/(?<=[.!?])\s+/).filter(Boolean)
        : [];

  const chinese =
    trim(raw.chinese) || trim(raw.titleChinese) || trim(raw.phraseChinese);
  const pinyin = trim(raw.pinyin) || trim(raw.reading);
  const mongolian =
    trim(raw.mongolian) ||
    trim(raw.mn) ||
    trim(raw.meaningMn) ||
    pickLearnerMnText({ practiceMn: raw.practiceMn });

  const examples = parseExamples(
    raw.examples ?? raw.items ?? raw.lines ?? raw.tones ?? raw.rows
  );

  const imageId =
    trim(raw.imageId) ||
    trim(raw.image) ||
    trim(raw.mediaImageId) ||
    trim(raw.heroImageId);

  const mediaSection =
    trim(raw.mediaSection) ||
    trim(raw.section) ||
    trim(raw.imageSection) ||
    imageId ||
    (type === "teacher-intro"
      ? "teacher"
      : type === "key-phrase"
        ? "hero"
        : type === "pinyin"
          ? "pinyin"
          : type === "tones"
            ? "tone"
            : type === "dialogue"
              ? "dialogue"
              : id);

  if (
    allBullets.length === 0 &&
    !chinese &&
    !mongolian &&
    examples.length === 0 &&
    type === "content"
  ) {
    return null;
  }

  return {
    id,
    type,
    titleMn,
    teacherSpeechMn: teacherSpeech,
    bulletsMn: allBullets,
    chinese,
    pinyin,
    mongolian,
    examples,
    imageId,
    mediaSection,
    sourceType,
    toneLayout,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

export function withGuidedStepMeta(
  step: Omit<HskGuidedStep, "sourceType" | "toneLayout"> &
    Partial<Pick<HskGuidedStep, "sourceType" | "toneLayout">>
): HskGuidedStep {
  const sourceType = step.sourceType ?? step.type;
  const toneLayout =
    step.toneLayout ??
    (sourceType.toLowerCase().replace(/[_\s]+/g, "-").includes("tone-production")
      ? "production"
      : "standard");
  return { ...step, sourceType, toneLayout };
}

export function parseHskGuidedSteps(raw: unknown): HskGuidedStep[] {
  if (!Array.isArray(raw)) return [];
  const steps: HskGuidedStep[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const step = normalizeGuidedStep(raw[i], i);
    if (step) steps.push(step);
  }
  return steps;
}
