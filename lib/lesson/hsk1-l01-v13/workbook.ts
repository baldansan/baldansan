/** Workbook exercise section for HSK1 Lesson 1 practice center. */

export type HskWorkbookAudioRef = {
  file?: string;
  url?: string;
  /** null when whole-exercise audio — never invent timestamps. */
  startSec: number | null;
  endSec: number | null;
  note?: string;
};

export type HskWorkbookSection = {
  id: string;
  /** Chinese section label e.g. 一 */
  sectionLabel: string;
  titleMn: string;
  titleZh?: string;
  instructionsMn?: string;
  /** Source page image from package when interactive UI not ready. */
  pageImageUrl?: string;
  pageImageId?: string;
  audio?: HskWorkbookAudioRef;
  /** Answer key — admin/review only. */
  answerKey?: string | string[];
  sourceRef?: string;
};

export const HSK1_L01_V13_WORKBOOK_SECTIONS: HskWorkbookSection[] = [
  {
    id: "wb-一",
    sectionLabel: "一",
    titleMn: "Пиньинь — эхний авиа, сүүл авиа",
    titleZh: "一、拼音",
    instructionsMn: "Пиньиний эхний авиа, сүүл авиаг холбож унш.",
    sourceRef: "WB1-L01-EX01",
  },
  {
    id: "wb-二",
    sectionLabel: "二",
    titleMn: "Пиньинь — 4 хөг",
    titleZh: "二、拼音",
    instructionsMn: "4 хөгийг зөв тэмдэглэ.",
    sourceRef: "WB1-L01-EX02",
  },
  {
    id: "wb-三",
    sectionLabel: "三",
    titleMn: "Ханз бичих",
    titleZh: "三、汉字",
    instructionsMn: "Зураасны дараалалтай бич.",
    answerKey: ["一", "二", "三", "十", "八", "六"],
    sourceRef: "WB1-L01-EX03",
  },
  {
    id: "wb-四",
    sectionLabel: "四",
    titleMn: "Сонсож ойлгох",
    titleZh: "四、听力",
    instructionsMn: "Сонсоод зөв хариултыг сонго.",
    audio: {
      startSec: null,
      endSec: null,
      note: "whole exercise audio",
    },
    answerKey: ["B", "A", "C"],
    sourceRef: "WB1-L01-EX04",
  },
  {
    id: "wb-五",
    sectionLabel: "五",
    titleMn: "Сонсож ойлгох — үг",
    titleZh: "五、听力",
    instructionsMn: "Сонсоод зөв үгийг сонго.",
    audio: {
      startSec: null,
      endSec: null,
      note: "whole exercise audio",
    },
    answerKey: ["你好", "您", "你们"],
    sourceRef: "WB1-L01-EX05",
  },
  {
    id: "wb-六",
    sectionLabel: "六",
    titleMn: "Сонсож ойлгох — яриа",
    titleZh: "六、听力",
    instructionsMn: "Яриаг сонсоод зөв хариултыг сонго.",
    audio: {
      startSec: null,
      endSec: null,
      note: "whole exercise audio",
    },
    answerKey: ["对不起", "没关系"],
    sourceRef: "WB1-L01-EX06",
  },
  {
    id: "wb-七",
    sectionLabel: "七",
    titleMn: "Уншиж ойлгох",
    titleZh: "七、阅读",
    instructionsMn: "Уншиж зөв хариултыг сонго.",
    answerKey: ["nǐ hǎo", "nín hǎo", "nǐmen hǎo"],
    sourceRef: "WB1-L01-EX07",
  },
  {
    id: "wb-八",
    sectionLabel: "八",
    titleMn: "Давтах дасгал",
    titleZh: "八、综合",
    instructionsMn: "Сурсан зүйлээ бататга.",
    sourceRef: "WB1-L01-EX08",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

const SECTION_LABELS = ["一", "二", "三", "四", "五", "六", "七", "八"] as const;

function parseWorkbookSectionFromRaw(
  label: string,
  raw: unknown,
  index: number
): HskWorkbookSection | null {
  const fallback = HSK1_L01_V13_WORKBOOK_SECTIONS[index];
  if (!fallback) return null;

  if (!isRecord(raw)) return fallback;

  const titleMn =
    trim(raw.titleMn) || trim(raw.title) || trim(raw.mongolian) || fallback.titleMn;
  const titleZh = trim(raw.titleZh) || trim(raw.titleChinese) || fallback.titleZh;
  const instructionsMn =
    trim(raw.instructionsMn) ||
    trim(raw.instructionMn) ||
    trim(raw.bodyMn) ||
    fallback.instructionsMn;

  let answerKey: string | string[] | undefined = fallback.answerKey;
  if (raw.answerKey != null) {
    if (Array.isArray(raw.answerKey)) {
      answerKey = raw.answerKey.map(String);
    } else {
      answerKey = trim(raw.answerKey) || undefined;
    }
  } else if (raw.answers != null && Array.isArray(raw.answers)) {
    answerKey = raw.answers.map(String);
  }

  let audio: HskWorkbookAudioRef | undefined = fallback.audio;
  if (isRecord(raw.audio)) {
    audio = {
      file: trim(raw.audio.file) || undefined,
      url: trim(raw.audio.url) || undefined,
      startSec:
        raw.audio.startSec != null ? Number(raw.audio.startSec) : null,
      endSec: raw.audio.endSec != null ? Number(raw.audio.endSec) : null,
      note: trim(raw.audio.note) || undefined,
    };
  } else if (trim(raw.audioUrl)) {
    audio = {
      url: trim(raw.audioUrl),
      startSec: null,
      endSec: null,
      note: "whole exercise audio",
    };
  }

  return {
    ...fallback,
    titleMn,
    titleZh,
    instructionsMn,
    pageImageUrl: trim(raw.pageImageUrl) || fallback.pageImageUrl,
    pageImageId: trim(raw.pageImageId) || fallback.pageImageId,
    answerKey,
    audio,
    sourceRef: trim(raw.sourceRef) || fallback.sourceRef,
  };
}

/** Merge imported workbook payload with V13 section structure. */
export function resolveHsk1L01WorkbookSections(
  workbookPayload: unknown
): HskWorkbookSection[] {
  if (!workbookPayload) return [...HSK1_L01_V13_WORKBOOK_SECTIONS];

  const sections: HskWorkbookSection[] = [];

  if (Array.isArray(workbookPayload)) {
    workbookPayload.forEach((item, index) => {
      const label = SECTION_LABELS[index] ?? String(index + 1);
      const parsed = parseWorkbookSectionFromRaw(label, item, index);
      if (parsed) sections.push(parsed);
    });
    if (sections.length >= 8) return sections.slice(0, 8);
  }

  if (isRecord(workbookPayload)) {
    if (Array.isArray(workbookPayload.sections)) {
      return resolveHsk1L01WorkbookSections(workbookPayload.sections);
    }

    for (let i = 0; i < SECTION_LABELS.length; i++) {
      const label = SECTION_LABELS[i];
      const keys = [
        label,
        `exercise${label}`,
        `exercise_${label}`,
        `section${i + 1}`,
        `ex${i + 1}`,
      ];
      let raw: unknown = null;
      for (const key of keys) {
        if (workbookPayload[key] != null) {
          raw = workbookPayload[key];
          break;
        }
      }
      if (raw == null && workbookPayload.exercises != null) {
        const ex = workbookPayload.exercises;
        if (Array.isArray(ex) && ex[i]) raw = ex[i];
      }
      const parsed = parseWorkbookSectionFromRaw(label, raw ?? {}, i);
      if (parsed) sections.push(parsed);
    }
    if (sections.length > 0) return sections;
  }

  return [...HSK1_L01_V13_WORKBOOK_SECTIONS];
}
