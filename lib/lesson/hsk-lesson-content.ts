import { parseTagFromSourceNote } from "@/lib/lesson-content-type";
import { parseHskGuidedSteps, type HskGuidedStep } from "@/lib/lesson/hsk-guided-step";
import { formatLearnerTeacherNotes } from "@/lib/lesson/format-learner-teacher-note";
import { parseHskMediaBundle, parseHskMediaFromLesson, type HskMediaBundle } from "@/lib/lesson/hsk-media";
import { parseSourceNoteSegment } from "@/lib/lesson/hsk-source-note";
import {
  parseLegacySourceNoteJsonSegment,
  parseLessonSourceNote,
} from "@/lib/lesson/source-note-json";
import {
  HSK_CHARACTER_ALIASES,
  HSK_DIALOGUE_ALIASES,
  HSK_SENTENCE_ALIASES,
  HSK_STUDY_GUIDE_ALIASES,
} from "@/lib/lesson/hsk-study-section-aliases";
import {
  collectHskTextBlocks,
  resolveHskObjectives,
  resolveHskPinyinSection,
  resolveHskRawSection,
  resolveHskTeacherNotes,
  resolveHskTextSection,
  resolveHskToneRaw,
  type HskStudyPayloadPool,
  type HskStudySectionDebugMap,
} from "@/lib/lesson/hsk-study-section-resolver";
import type { LessonContent } from "@/types/lesson-content";
import type { VocabularyWord } from "@/types/lesson";

export type HskToneExample = {
  label: string;
  example: string;
  pinyin: string;
  mongolian: string;
};

export type HskDialogueLine = {
  speaker?: string;
  chinese: string;
  pinyin?: string;
  mongolian?: string;
};

export type HskDialogue = {
  title?: string;
  lines: HskDialogueLine[];
};

export type HskCharacterComponent = {
  component: string;
  nameMn?: string;
  meaningMn?: string;
  position?: string;
};

export type HskCharacterNote = {
  chinese: string;
  pinyin?: string;
  mongolian?: string;
  strokeNote?: string;
  mnemonic?: string;
  structure?: string;
  components?: HskCharacterComponent[];
  formula?: string;
  strokeImageUrl?: string;
};

export type HskStudyContent = {
  profileId: string | null;
  hskLevel: number | null;
  objectives: string[];
  pinyinIntro: string[];
  pronunciationNotes: string[];
  tones: HskToneExample[];
  dialogues: HskDialogue[];
  sentenceExplanations: string[];
  characterNotes: HskCharacterNote[];
  studyGuideSteps: string[];
  guidedSteps: HskGuidedStep[];
  teacherNotes: string[];
  media: HskMediaBundle | null;
  /** Dev-only section resolution metadata (when NODE_ENV=development). */
  sectionDebug?: HskStudySectionDebugMap;
};

const HSK1_PROFILE = "hsk1-pronunciation-character-basic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function parseJsonSegment(sourceNote: string | undefined | null, key: string): unknown {
  const raw = parseSourceNoteSegment(sourceNote, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = value.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

const DEFAULT_TONE_EXAMPLES = ["mā", "má", "mǎ", "mà"] as const;
const DEFAULT_TONE_LABELS = [
  "1-р өнгө",
  "2-р өнгө",
  "3-р өнгө",
  "4-р өнгө",
] as const;
const DEFAULT_TONE_MN = [
  "өндөр, тэгш",
  "дээшлэх",
  "доошлоод дээшлэх",
  "огцом буух",
] as const;

function parseToneExamples(value: unknown): HskToneExample[] {
  const rows: HskToneExample[] = [];

  const pushRow = (item: Record<string, unknown>, index: number) => {
    const toneNum =
      Number(item.toneNumber ?? item.tone ?? item.number ?? index + 1) || index + 1;
    const label =
      trim(item.label) ||
      trim(item.titleMn) ||
      trim(item.name) ||
      trim(item.title) ||
      (DEFAULT_TONE_LABELS[toneNum - 1] ?? `${toneNum}-р өнгө`);
    const example =
      trim(item.example) ||
      trim(item.word) ||
      trim(item.chinese) ||
      trim(item.titleChinese) ||
      (DEFAULT_TONE_EXAMPLES[toneNum - 1] ?? "");
    const pinyin =
      trim(item.pinyin) ||
      trim(item.reading) ||
      example ||
      (DEFAULT_TONE_EXAMPLES[toneNum - 1] ?? "");
    const mongolian =
      trim(item.mongolian) ||
      trim(item.mn) ||
      trim(item.description) ||
      trim(item.explanation) ||
      (DEFAULT_TONE_MN[toneNum - 1] ?? "");
    if (!example && !pinyin && !mongolian) return;
    rows.push({
      label,
      example: example || pinyin,
      pinyin,
      mongolian,
    });
  };

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (isRecord(item)) pushRow(item, index);
      else if (typeof item === "string" && item.trim()) {
        rows.push({
          label: `${index + 1}-р өнгө`,
          example: item.trim(),
          pinyin: item.trim(),
          mongolian: "",
        });
      }
    });
    return rows;
  }

  if (isRecord(value)) {
    if (Array.isArray(value.tones)) return parseToneExamples(value.tones);
    if (Array.isArray(value.items)) return parseToneExamples(value.items);
    if (Array.isArray(value.examples)) return parseToneExamples(value.examples);
    for (const [key, item] of Object.entries(value)) {
      if (isRecord(item)) {
        pushRow({ ...item, label: item.label ?? key }, rows.length);
      } else if (typeof item === "string" && item.trim()) {
        rows.push({
          label: key,
          example: item.trim(),
          pinyin: item.trim(),
          mongolian: "",
        });
      }
    }
  }

  return rows;
}

function parseToneExamplesFromRawItems(rawItems: unknown[]): HskToneExample[] {
  const rows: HskToneExample[] = [];
  for (const item of rawItems) {
    rows.push(...parseToneExamples(item));
  }
  return rows;
}

function parseDialogueLines(value: unknown): HskDialogueLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): HskDialogueLine | null => {
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { chinese: text } : null;
      }
      if (!isRecord(item)) return null;
      const chinese =
        trim(item.chinese) || trim(item.target) || trim(item.text);
      if (!chinese) return null;
      return {
        speaker: trim(item.speaker) || trim(item.role) || undefined,
        chinese,
        pinyin: trim(item.pinyin) || trim(item.reading) || undefined,
        mongolian: trim(item.mongolian) || trim(item.mn) || undefined,
      };
    })
    .filter((line): line is HskDialogueLine => line !== null);
}

function parseDialogues(textsPayload: unknown, lessonPayload: unknown): HskDialogue[] {
  const dialogues: HskDialogue[] = [];

  const pushDialogue = (value: unknown, title?: string) => {
    if (Array.isArray(value)) {
      const lines = parseDialogueLines(value);
      if (lines.length) dialogues.push({ title, lines });
      return;
    }
    if (!isRecord(value)) return;
    if (Array.isArray(value.lines)) {
      dialogues.push({
        title: title || trim(value.title) || undefined,
        lines: parseDialogueLines(value.lines),
      });
      return;
    }
    if (Array.isArray(value.exchanges)) {
      for (const exchange of value.exchanges) {
        pushDialogue(exchange);
      }
    }
  };

  if (isRecord(textsPayload)) {
    if (Array.isArray(textsPayload.dialogues)) {
      for (const item of textsPayload.dialogues) {
        if (isRecord(item)) {
          pushDialogue(item.lines ?? item, trim(item.title));
        } else {
          pushDialogue(item);
        }
      }
    }
    if (Array.isArray(textsPayload.basicSentences)) {
      pushDialogue(textsPayload.basicSentences, "Үндсэн өгүүлбэр");
    }
  }

  if (isRecord(lessonPayload)) {
    if (lessonPayload.dialogues) pushDialogue(lessonPayload.dialogues);
    if (lessonPayload.basicSentences) {
      pushDialogue(lessonPayload.basicSentences, "Үндсэн өгүүлбэр");
    }
  }

  return dialogues.filter((d) => d.lines.length > 0);
}

function parseSentenceExplanationsFromBasicSentences(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const rows: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) rows.push(text);
      continue;
    }
    if (!isRecord(item)) continue;
    const pattern =
      trim(item.pattern) ||
      trim(item.formula) ||
      trim(item.chinese) ||
      trim(item.sentence);
    const explanation =
      trim(item.explanation) ||
      trim(item.mongolian) ||
      trim(item.mn) ||
      trim(item.note) ||
      trim(item.description);
    if (pattern && explanation) {
      rows.push(`${pattern} — ${explanation}`);
    } else if (pattern || explanation) {
      rows.push(pattern || explanation);
    }
  }
  return rows;
}

function parseCharacterNotesFromRaw(
  rawItems: unknown[],
  vocabulary: VocabularyWord[]
): HskCharacterNote[] {
  const notes: HskCharacterNote[] = [];

  const pushChar = (item: Record<string, unknown>) => {
    const chinese =
      trim(item.chinese) || trim(item.character) || trim(item.hanzi);
    if (!chinese) return;

    const rawComponents = item.components;
    const components: HskCharacterComponent[] = [];
    if (Array.isArray(rawComponents)) {
      for (const row of rawComponents) {
        if (!isRecord(row)) continue;
        const component =
          trim(row.component) || trim(row.radical) || trim(row.part);
        if (!component) continue;
        components.push({
          component,
          nameMn: trim(row.nameMn) || trim(row.name) || undefined,
          meaningMn:
            trim(row.meaningMn) || trim(row.meaning) || undefined,
          position: trim(row.position) || undefined,
        });
      }
    }

    notes.push({
      chinese,
      pinyin: trim(item.pinyin) || trim(item.reading) || undefined,
      mongolian: trim(item.mongolian) || trim(item.meaning) || undefined,
      strokeNote:
        trim(item.strokeNote) ||
        trim(item.strokes) ||
        trim(item.writingNote) ||
        trim(item.strokeOrderDescriptionMn) ||
        undefined,
      mnemonic: trim(item.mnemonic) || trim(item.hint) || undefined,
      structure: trim(item.structure) || undefined,
      formula: trim(item.formula) || undefined,
      strokeImageUrl:
        trim(item.strokeImageUrl) ||
        trim(item.strokeImage) ||
        trim(item.strokeOrderImageUrl) ||
        undefined,
      components: components.length > 0 ? components : undefined,
    });
  };

  for (const item of rawItems) {
    if (isRecord(item)) {
      pushChar(item);
      continue;
    }
    if (Array.isArray(item)) {
      for (const row of item) {
        if (isRecord(row)) pushChar(row);
      }
    }
  }

  if (notes.length === 0) {
    for (const word of vocabulary.slice(0, 8)) {
      if (word.chinese.length <= 3) {
        notes.push({
          chinese: word.chinese,
          pinyin: word.pinyin || undefined,
          mongolian: word.mongolian,
          mnemonic:
            word.mongolianPronunciation ||
            word.pronunciationHintMn ||
            word.pronunciationMn ||
            undefined,
        });
      }
    }
  }

  return notes;
}

function buildPayloadPool(sourceNote: string | undefined | null): HskStudyPayloadPool {
  const parsed = parseLessonSourceNote(sourceNote);

  if (parsed.format === "json") {
    const hskStudyContent = parsed.data.hskStudyContent;
    const studyRecord = isRecord(hskStudyContent) ? hskStudyContent : null;

    return {
      studyContent: hskStudyContent ?? null,
      lessonPayload:
        studyRecord?.lessonTeaching ??
        parseLegacySourceNoteJsonSegment(sourceNote, "hskLesson") ??
        null,
      textsPayload:
        studyRecord?.texts ??
        parseLegacySourceNoteJsonSegment(sourceNote, "hskTexts") ??
        null,
      grammarPayload:
        studyRecord?.grammar ??
        parseLegacySourceNoteJsonSegment(sourceNote, "hskGrammar") ??
        null,
      notesPayload:
        studyRecord?.notes ??
        parseLegacySourceNoteJsonSegment(sourceNote, "hskNotes") ??
        null,
      workbookPayload:
        studyRecord?.workbook ??
        parseLegacySourceNoteJsonSegment(sourceNote, "hskWorkbook") ??
        null,
    };
  }

  const lessonPayload = parseJsonSegment(sourceNote, "hskLesson");
  const explicitStudyContent = parseJsonSegment(sourceNote, "hskStudyContent");

  let studyContent = explicitStudyContent;
  if (!studyContent && isRecord(lessonPayload)) {
    studyContent =
      lessonPayload.studyContent ??
      lessonPayload["study-content"] ??
      null;
  }

  return {
    studyContent,
    lessonPayload,
    textsPayload: parseJsonSegment(sourceNote, "hskTexts"),
    grammarPayload: parseJsonSegment(sourceNote, "hskGrammar"),
    notesPayload: parseJsonSegment(sourceNote, "hskNotes"),
    workbookPayload: parseJsonSegment(sourceNote, "hskWorkbook"),
  };
}

export function isHsk1FoundationLesson(
  lesson: Pick<LessonContent, "courseId" | "sourceNote" | "lessonType">
): boolean {
  const profile =
    parseTagFromSourceNote(lesson.sourceNote, "lessonProfile") ??
    lesson.lessonType?.toLowerCase();
  if (profile === HSK1_PROFILE) return true;
  const course = lesson.courseId.toLowerCase();
  if (course === "hsk1" || course.startsWith("hsk1-")) return true;
  const level = parseTagFromSourceNote(lesson.sourceNote, "hskLevel");
  return level === "1" && course.includes("hsk");
}

export function isHskStructuredLesson(
  lesson: Pick<LessonContent, "courseId" | "sourceNote" | "lessonType">
): boolean {
  if (isHsk1FoundationLesson(lesson)) return true;
  const profile =
    parseTagFromSourceNote(lesson.sourceNote, "lessonProfile") ??
    lesson.lessonType?.toLowerCase();
  if (profile?.startsWith("hsk")) return true;
  return lesson.courseId.toLowerCase().includes("hsk");
}

export function parseHskStudyContentFromLesson(
  lesson: LessonContent
): HskStudyContent {
  const profileId =
    parseTagFromSourceNote(lesson.sourceNote, "lessonProfile") ??
    lesson.lessonType ??
    null;
  const levelRaw = parseTagFromSourceNote(lesson.sourceNote, "hskLevel");
  const hskLevel = levelRaw ? Number(levelRaw) : null;

  const pool = buildPayloadPool(lesson.sourceNote);

  const objectivesResolved = resolveHskObjectives(pool);
  const objectives = uniqueStrings([
    ...objectivesResolved.value,
    ...(lesson.description?.trim() ? [lesson.description.trim()] : []),
    ...(lesson.subtitle?.trim() ? [lesson.subtitle.trim()] : []),
  ]);

  const pinyinResolved = resolveHskPinyinSection(pool);
  const pinyinAll = pinyinResolved.value;
  const pinyinIntro = pinyinAll;
  const pronunciationNotes: string[] = [];

  const toneRaw = resolveHskToneRaw(pool);
  const tones = parseToneExamplesFromRawItems(toneRaw.value);

  const dialogueRaw = resolveHskRawSection(pool, HSK_DIALOGUE_ALIASES, "dialogues");
  let dialogues = parseDialogues(pool.textsPayload, pool.lessonPayload);
  if (dialogues.length === 0 && dialogueRaw.count > 0) {
    dialogues = parseDialogues({ dialogues: dialogueRaw.value }, null);
  }

  const sentenceResolved = resolveHskTextSection(
    pool,
    HSK_SENTENCE_ALIASES,
    "sentenceExplanations"
  );
  const sentenceExplanations = uniqueStrings([
    ...sentenceResolved.value,
    ...parseSentenceExplanationsFromBasicSentences(
      isRecord(pool.lessonPayload) ? pool.lessonPayload.basicSentences : null
    ),
    ...parseSentenceExplanationsFromBasicSentences(
      isRecord(pool.textsPayload) ? pool.textsPayload.basicSentences : null
    ),
    ...collectHskTextBlocks(
      isRecord(pool.grammarPayload) ? pool.grammarPayload.grammarPatterns : null
    ),
    ...collectHskTextBlocks(
      isRecord(pool.grammarPayload) ? pool.grammarPayload.sentencePatterns : null
    ),
    ...collectHskTextBlocks(
      isRecord(pool.grammarPayload) ? pool.grammarPayload.explanations : null
    ),
  ]);

  const characterRaw = resolveHskRawSection(pool, HSK_CHARACTER_ALIASES, "characters");
  const characterNotes = parseCharacterNotesFromRaw(
    characterRaw.value,
    lesson.vocabulary
  );

  const studyGuideResolved = resolveHskTextSection(
    pool,
    HSK_STUDY_GUIDE_ALIASES,
    "studyGuide"
  );
  const studyGuideSteps = uniqueStrings(studyGuideResolved.value);

  let guidedSteps: HskGuidedStep[] = [];
  if (isRecord(pool.studyContent)) {
    guidedSteps = parseHskGuidedSteps(pool.studyContent.guidedSteps);
  }
  if (guidedSteps.length === 0) {
    const parsedNote = parseLessonSourceNote(lesson.sourceNote);
    if (parsedNote.format === "json" && isRecord(parsedNote.data.hskStudyContent)) {
      guidedSteps = parseHskGuidedSteps(parsedNote.data.hskStudyContent.guidedSteps);
    }
  }

  const teacherResolved = resolveHskTeacherNotes(pool);
  const teacherNotes = formatLearnerTeacherNotes(teacherResolved.value);

  let media: HskMediaBundle | null = parseHskMediaFromLesson(lesson);
  if (!media && isRecord(pool.studyContent)) {
    media = parseHskMediaBundle(pool.studyContent.media);
  }

  const sectionDebug: HskStudySectionDebugMap = {
    objectives: {
      value: objectives,
      source: objectivesResolved.source,
      count: objectives.length,
    },
    pinyin: {
      value: pinyinAll,
      source: pinyinResolved.source,
      count: pinyinAll.length,
    },
    tones: {
      value: toneRaw.value,
      source: toneRaw.source,
      count: tones.length,
    },
    dialogues: {
      value: dialogueRaw.value,
      source: dialogueRaw.count > 0 ? dialogueRaw.source : "hskTexts.dialogues",
      count: dialogues.length,
    },
    sentenceExplanations: {
      value: sentenceExplanations,
      source: sentenceResolved.source,
      count: sentenceExplanations.length,
    },
    characterNotes: {
      value: characterRaw.value,
      source: characterRaw.source,
      count: characterNotes.length,
    },
    studyGuideSteps: {
      value: studyGuideSteps,
      source: studyGuideResolved.source,
      count: studyGuideSteps.length,
    },
    teacherNotes: {
      value: teacherNotes,
      source: teacherResolved.source,
      count: teacherNotes.length,
    },
  };

  return {
    profileId,
    hskLevel: Number.isFinite(hskLevel) ? hskLevel : null,
    objectives,
    pinyinIntro,
    pronunciationNotes,
    tones,
    dialogues,
    sentenceExplanations,
    characterNotes,
    studyGuideSteps,
    guidedSteps,
    teacherNotes,
    media,
    ...(process.env.NODE_ENV === "development" ? { sectionDebug } : {}),
  };
}

export function enrichLessonHskContent(lesson: LessonContent): LessonContent {
  if (!isHskStructuredLesson(lesson)) {
    return lesson;
  }

  const hskStudy = parseHskStudyContentFromLesson(lesson);
  return {
    ...lesson,
    hskStudy,
  };
}
