import { parseTagFromSourceNote } from "@/lib/lesson-content-type";
import { parseSourceNoteSegment } from "@/lib/lesson/hsk-source-note";
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

export type HskCharacterNote = {
  chinese: string;
  pinyin?: string;
  mongolian?: string;
  strokeNote?: string;
  mnemonic?: string;
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
  teacherNotes: string[];
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

function pickText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!isRecord(value)) return "";
  return (
    trim(value.mongolian) ||
    trim(value.mn) ||
    trim(value.text) ||
    trim(value.description) ||
    trim(value.content) ||
    trim(value.summary) ||
    ""
  );
}

function collectTextBlocks(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) out.push(text);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTextBlocks(item, out);
    return out;
  }
  if (isRecord(value)) {
    const direct = pickText(value);
    if (direct) out.push(direct);
    for (const key of [
      "objectives",
      "items",
      "points",
      "bullets",
      "notes",
      "paragraphs",
      "lines",
      "examples",
    ]) {
      if (key in value) collectTextBlocks(value[key], out);
    }
  }
  return out;
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

function parseToneExamples(value: unknown): HskToneExample[] {
  const rows: HskToneExample[] = [];

  const pushRow = (item: Record<string, unknown>, index: number) => {
    const label =
      trim(item.label) ||
      trim(item.name) ||
      trim(item.tone) ||
      `${index + 1}-р өнгө`;
    const example =
      trim(item.example) || trim(item.word) || trim(item.chinese) || "";
    const pinyin =
      trim(item.pinyin) || trim(item.reading) || example;
    const mongolian =
      trim(item.mongolian) ||
      trim(item.mn) ||
      trim(item.description) ||
      "";
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
        title: title || pickText(value.title) || undefined,
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
          pushDialogue(item.lines ?? item, pickText(item.title));
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

function parseCharacterNotes(
  lessonPayload: unknown,
  vocabulary: VocabularyWord[]
): HskCharacterNote[] {
  const notes: HskCharacterNote[] = [];

  const pushChar = (item: Record<string, unknown>) => {
    const chinese =
      trim(item.chinese) || trim(item.character) || trim(item.hanzi);
    if (!chinese) return;
    notes.push({
      chinese,
      pinyin: trim(item.pinyin) || trim(item.reading) || undefined,
      mongolian: trim(item.mongolian) || trim(item.meaning) || undefined,
      strokeNote:
        trim(item.strokeNote) ||
        trim(item.strokes) ||
        trim(item.writingNote) ||
        undefined,
      mnemonic: trim(item.mnemonic) || trim(item.hint) || undefined,
    });
  };

  if (isRecord(lessonPayload) && lessonPayload.characters) {
    const chars = lessonPayload.characters;
    if (Array.isArray(chars)) {
      for (const item of chars) {
        if (isRecord(item)) pushChar(item);
      }
    } else if (isRecord(chars) && Array.isArray(chars.items)) {
      for (const item of chars.items) {
        if (isRecord(item)) pushChar(item);
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

/** True when the lesson should render the structured HSK study layout. */
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

  const lessonPayload = parseJsonSegment(lesson.sourceNote, "hskLesson");
  const textsPayload = parseJsonSegment(lesson.sourceNote, "hskTexts");
  const grammarPayload = parseJsonSegment(lesson.sourceNote, "hskGrammar");
  const notesPayload = parseJsonSegment(lesson.sourceNote, "hskNotes");
  const workbookPayload = parseJsonSegment(lesson.sourceNote, "hskWorkbook");

  const objectives = uniqueStrings([
    ...collectTextBlocks(
      isRecord(lessonPayload) ? lessonPayload.lessonIntro : null
    ),
    ...collectTextBlocks(
      isRecord(lessonPayload) ? lessonPayload.objectives : null
    ),
    ...(lesson.description?.trim() ? [lesson.description.trim()] : []),
    ...(lesson.subtitle?.trim() ? [lesson.subtitle.trim()] : []),
  ]);

  const pinyinIntro = uniqueStrings([
    ...collectTextBlocks(
      isRecord(lessonPayload) ? lessonPayload.pinyinPronunciation : null
    ),
    ...collectTextBlocks(
      isRecord(textsPayload) ? textsPayload.pinyinPronunciation : null
    ),
  ]);

  const pronunciationNotes = uniqueStrings(
    collectTextBlocks(
      isRecord(lessonPayload) ? lessonPayload.pronunciationNotes : null
    )
  );

  let tones = parseToneExamples(
    isRecord(lessonPayload) ? lessonPayload.tones : null
  );

  const dialogues = parseDialogues(textsPayload, lessonPayload);

  const sentenceExplanations = uniqueStrings([
    ...parseSentenceExplanationsFromBasicSentences(
      isRecord(lessonPayload) ? lessonPayload.basicSentences : null
    ),
    ...parseSentenceExplanationsFromBasicSentences(
      isRecord(textsPayload) ? textsPayload.basicSentences : null
    ),
    ...collectTextBlocks(
      isRecord(grammarPayload) ? grammarPayload.grammarPatterns : null
    ),
    ...collectTextBlocks(
      isRecord(grammarPayload) ? grammarPayload.sentencePatterns : null
    ),
    ...collectTextBlocks(
      isRecord(grammarPayload) ? grammarPayload.explanations : null
    ),
    ...collectTextBlocks(isRecord(grammarPayload) ? grammarPayload : null),
  ]);

  const characterNotes = parseCharacterNotes(lessonPayload, lesson.vocabulary);

  const studyGuideSteps = uniqueStrings([
    ...collectTextBlocks(
      isRecord(workbookPayload) ? workbookPayload.studyGuide : null
    ),
    ...collectTextBlocks(
      isRecord(lessonPayload) ? lessonPayload.studyGuide : null
    ),
    ...collectTextBlocks(
      isRecord(workbookPayload) ? workbookPayload.practiceGuide : null
    ),
  ]);

  const teacherNotes = uniqueStrings([
    ...collectTextBlocks(isRecord(notesPayload) ? notesPayload.teacherNotes : null),
    ...collectTextBlocks(isRecord(notesPayload) ? notesPayload.teachersBook : null),
    ...collectTextBlocks(isRecord(notesPayload) ? notesPayload.notes : null),
    ...collectTextBlocks(isRecord(notesPayload) ? notesPayload : null),
  ]);

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
    teacherNotes,
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
