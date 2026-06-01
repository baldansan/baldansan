import {
  inferProfileFromHskLevel,
  isKnownHskProfile,
  type HskLessonProfileId,
} from "@/lib/import/chinese-hsk-profiles";

const SOURCE_NOTE_SEP = " · ";

export type ChineseHskManifest = {
  packageVersion: string;
  courseType: string;
  courseId: string;
  lessonId: string;
  language: string;
  hskLevel: number;
  bookPart: string | null;
  lessonNumber: number | null;
  lessonProfile: HskLessonProfileId;
  source?: Record<string, unknown>;
  verification?: Record<string, unknown>;
  title?: string;
  mongolianTitle?: string;
  targetLanguage?: string;
  uiLanguage?: string;
};

export type ChineseHskRawFiles = {
  manifest: unknown;
  lesson: unknown;
  texts: unknown;
  vocabulary: unknown;
  grammar: unknown;
  notes: unknown;
  workbook: unknown;
  quiz: unknown;
  audioManifest: unknown;
  subtitles: unknown;
  studyContent: unknown;
};

export type ChineseHskSectionInventory = Record<string, unknown>;

export type ChineseHskPackageMeta = {
  manifest: ChineseHskManifest | null;
  sections: ChineseHskSectionInventory;
  textCount: number;
  workbookListeningCount: number;
  workbookReadingCount: number;
  workbookWritingCount: number;
  workbookExerciseCount: number;
  textsPayload: unknown;
  workbookPayload: unknown;
  grammarPayload: unknown;
  notesPayload: unknown;
  studyContentPayload: unknown;
};

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.floor(num) : null;
}

function isNonEmpty(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
}

function appendSourceNoteSegment(
  sourceNote: string | undefined | null,
  key: string,
  value: string
): string {
  const base = sourceNote?.trim() ?? "";
  const segment = `${key}=${value}`;
  if (!base) return segment;
  if (base.includes(`${key}=`)) return base;
  return `${base}${SOURCE_NOTE_SEP}${segment}`;
}

export function isChineseHskManifestRaw(raw: unknown): boolean {
  if (!isRecord(raw)) return false;
  const courseType = trim(raw.courseType ?? raw.course_type).toLowerCase();
  if (courseType === "chinese-hsk" || courseType === "chinese_hsk") return true;
  if (parseNumber(raw.hskLevel ?? raw.hsk_level) != null) return true;
  const profile = trim(raw.lessonProfile ?? raw.lesson_profile);
  if (profile && isKnownHskProfile(profile)) return true;
  return false;
}

export function normalizeChineseHskManifest(
  raw: unknown,
  warnings: string[]
): ChineseHskManifest | null {
  if (!isRecord(raw)) return null;

  const courseType = trim(raw.courseType ?? raw.course_type) || "chinese-hsk";
  let packageVersion = trim(raw.packageVersion ?? raw.package_version);
  if (!packageVersion) {
    warnings.push(
      "manifest.json: packageVersion missing — import allowed for chinese-hsk with warning."
    );
    packageVersion = "BUUNDUU_CHINESE_HSK_PACKAGE_V1";
  }

  const courseId = trim(raw.courseId ?? raw.course_id);
  let lessonId = trim(raw.lessonId ?? raw.lesson_id);
  const lessonNumber = parseNumber(raw.lessonNumber ?? raw.lesson_number);

  if (!courseId) return null;

  if (!lessonId && lessonNumber != null) {
    lessonId = `${courseId}-l${lessonNumber}`;
    warnings.push(
      `manifest.json: lessonId missing — derived "${lessonId}" from lessonNumber.`
    );
  }

  const hskLevel = parseNumber(raw.hskLevel ?? raw.hsk_level);
  if (hskLevel == null || hskLevel < 1 || hskLevel > 6) {
    return null;
  }

  let lessonProfileRaw = trim(raw.lessonProfile ?? raw.lesson_profile);
  let lessonProfile: HskLessonProfileId;
  if (!lessonProfileRaw || !isKnownHskProfile(lessonProfileRaw)) {
    const inferred = inferProfileFromHskLevel(hskLevel);
    if (!inferred) return null;
    if (lessonProfileRaw) {
      warnings.push(
        `manifest.json: unknown lessonProfile "${lessonProfileRaw}" — inferred from hskLevel.`
      );
    }
    lessonProfile = inferred;
  } else {
    lessonProfile = lessonProfileRaw;
    if (inferProfileFromHskLevel(hskLevel) !== lessonProfile) {
      warnings.push("HSK түвшин ба lessonProfile зөрж байна.");
    }
  }

  const language = trim(raw.language) || "zh-MN";

  return {
    packageVersion,
    courseType,
    courseId,
    lessonId,
    language,
    hskLevel,
    bookPart: trim(raw.bookPart ?? raw.book_part) || null,
    lessonNumber,
    lessonProfile,
    source: isRecord(raw.source) ? raw.source : undefined,
    verification: isRecord(raw.verification) ? raw.verification : undefined,
    title: trim(raw.title) || undefined,
    mongolianTitle: trim(raw.mongolianTitle ?? raw.mongolian_title) || undefined,
    targetLanguage: trim(raw.targetLanguage ?? raw.target_language) || "zh",
    uiLanguage: trim(raw.uiLanguage ?? raw.ui_language) || "mn",
  };
}

function countWorkbookSection(workbook: Record<string, unknown>, keys: string[]): number {
  let total = 0;
  for (const key of keys) {
    const value = workbook[key];
    if (Array.isArray(value)) total += value.length;
    else if (isRecord(value)) total += Object.keys(value).length;
    else if (isNonEmpty(value)) total += 1;
  }
  return total;
}

function countTexts(textsRaw: unknown): number {
  if (!textsRaw) return 0;
  if (Array.isArray(textsRaw)) return textsRaw.length;
  if (!isRecord(textsRaw)) return 0;

  if (Array.isArray(textsRaw.texts)) return textsRaw.texts.length;
  if (Array.isArray(textsRaw.dialogues)) return textsRaw.dialogues.length;
  if (isNonEmpty(textsRaw.mainText)) return 1;
  if (isNonEmpty(textsRaw.longText)) return 1;
  if (Array.isArray(textsRaw.paragraphs)) return textsRaw.paragraphs.length;
  return 0;
}

/** Collect named sections from all HSK JSON files into one inventory. */
export function collectHskSectionInventory(input: {
  lesson: unknown;
  texts: unknown;
  vocabulary: unknown;
  grammar: unknown;
  notes: unknown;
  workbook: unknown;
  quiz: unknown;
  studyContent?: unknown;
}): ChineseHskSectionInventory {
  const sections: ChineseHskSectionInventory = {};

  function assign(key: string, value: unknown) {
    if (isNonEmpty(value)) sections[key] = value;
  }

  if (isRecord(input.lesson)) {
    for (const [key, value] of Object.entries(input.lesson)) {
      assign(key, value);
    }
  }

  if (isRecord(input.texts)) {
    for (const [key, value] of Object.entries(input.texts)) {
      assign(key, value);
    }
    if (Array.isArray(input.texts.texts)) {
      assign("texts", input.texts.texts);
    }
    if (Array.isArray(input.texts.dialogues)) {
      assign("dialogues", input.texts.dialogues);
    }
    if (input.texts.mainText) assign("mainText", input.texts.mainText);
    if (input.texts.longText) assign("longText", input.texts.longText);
    if (Array.isArray(input.texts.paragraphs)) {
      assign("paragraphs", input.texts.paragraphs);
    }
    if (input.texts.summaryPrompt) assign("summaryPrompt", input.texts.summaryPrompt);
  }

  if (Array.isArray(input.vocabulary) && input.vocabulary.length > 0) {
    assign("vocabulary", input.vocabulary);
  } else if (isRecord(input.vocabulary)) {
    for (const [key, value] of Object.entries(input.vocabulary)) {
      assign(key, value);
    }
  }

  if (isRecord(input.grammar)) {
    for (const [key, value] of Object.entries(input.grammar)) {
      assign(key, value);
    }
  }

  if (isRecord(input.notes)) {
    for (const [key, value] of Object.entries(input.notes)) {
      assign(key, value);
    }
  }

  if (isRecord(input.workbook)) {
    for (const [key, value] of Object.entries(input.workbook)) {
      const normalizedKey = key.startsWith("workbook")
        ? key
        : `workbook${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      assign(normalizedKey, value);
    }
    if (input.workbook.listening) assign("workbookListening", input.workbook.listening);
    if (input.workbook.reading) assign("workbookReading", input.workbook.reading);
    if (input.workbook.writing) assign("workbookWriting", input.workbook.writing);
    if (input.workbook.pronunciation) {
      assign("workbookPronunciation", input.workbook.pronunciation);
    }
    if (input.workbook.characters) assign("workbookCharacters", input.workbook.characters);
    if (input.workbook.review) assign("workbookReview", input.workbook.review);
    if (input.workbook.summaryWriting) {
      assign("workbookSummaryWriting", input.workbook.summaryWriting);
    }
  }

  if (Array.isArray(input.quiz) && input.quiz.length > 0) {
    assign("quiz", input.quiz);
  } else if (isRecord(input.quiz)) {
    for (const [key, value] of Object.entries(input.quiz)) {
      assign(key, value);
    }
  }

  if (isRecord(input.studyContent)) {
    for (const [key, value] of Object.entries(input.studyContent)) {
      assign(key, value);
    }
    if (Array.isArray(input.studyContent.studySections)) {
      assign("studySections", input.studyContent.studySections);
    }
    if (isRecord(input.studyContent.sections)) {
      assign("studyContentSections", input.studyContent.sections);
    }
  }

  return sections;
}

export function buildChineseHskPackageMeta(
  raw: ChineseHskRawFiles,
  manifest: ChineseHskManifest | null
): ChineseHskPackageMeta {
  const sections = collectHskSectionInventory(raw);
  const workbook = isRecord(raw.workbook) ? raw.workbook : {};

  return {
    manifest,
    sections,
    textCount: countTexts(raw.texts),
    workbookListeningCount: countWorkbookSection(workbook, [
      "listening",
      "workbookListening",
    ]),
    workbookReadingCount: countWorkbookSection(workbook, [
      "reading",
      "workbookReading",
    ]),
    workbookWritingCount: countWorkbookSection(workbook, [
      "writing",
      "workbookWriting",
      "summaryWriting",
      "workbookSummaryWriting",
    ]),
    workbookExerciseCount: countWorkbookSection(workbook, [
      "listening",
      "reading",
      "writing",
      "pronunciation",
      "characters",
      "review",
      "summaryWriting",
    ]),
    textsPayload: raw.texts ?? null,
    workbookPayload: raw.workbook ?? null,
    grammarPayload: raw.grammar ?? null,
    notesPayload: raw.notes ?? null,
    studyContentPayload: raw.studyContent ?? null,
  };
}

export function mergeHskProfileIntoSourceNote(
  sourceNote: string | undefined | null,
  manifest: ChineseHskManifest,
  meta: ChineseHskPackageMeta,
  options?: {
    lessonJson?: unknown;
    audioManifest?: unknown;
    studyContent?: unknown;
  }
): string {
  let note = sourceNote?.trim() ?? "";

  note = appendSourceNoteSegment(note, "courseType", manifest.courseType);
  note = appendSourceNoteSegment(note, "hskLevel", String(manifest.hskLevel));
  note = appendSourceNoteSegment(note, "lessonProfile", manifest.lessonProfile);
  note = appendSourceNoteSegment(note, "hskPackageVersion", manifest.packageVersion);

  if (manifest.bookPart) {
    note = appendSourceNoteSegment(note, "bookPart", manifest.bookPart);
  }
  if (manifest.lessonNumber != null) {
    note = appendSourceNoteSegment(note, "lessonNumber", String(manifest.lessonNumber));
  }

  const verification = manifest.verification;
  if (verification?.answerStatus) {
    note = appendSourceNoteSegment(
      note,
      "answerStatus",
      String(verification.answerStatus)
    );
  }
  if (verification?.textStatus) {
    note = appendSourceNoteSegment(note, "textStatus", String(verification.textStatus));
  }

  const inventory = {
    textCount: meta.textCount,
    workbookListening: meta.workbookListeningCount,
    workbookReading: meta.workbookReadingCount,
    workbookWriting: meta.workbookWritingCount,
    sectionKeys: Object.keys(meta.sections),
  };
  note = appendSourceNoteSegment(note, "hskInventory", JSON.stringify(inventory));

  if (meta.textsPayload) {
    note = appendSourceNoteSegment(note, "hskTexts", JSON.stringify(meta.textsPayload));
  }
  if (meta.workbookPayload) {
    note = appendSourceNoteSegment(
      note,
      "hskWorkbook",
      JSON.stringify(meta.workbookPayload)
    );
  }
  if (meta.grammarPayload) {
    note = appendSourceNoteSegment(
      note,
      "hskGrammar",
      JSON.stringify(meta.grammarPayload)
    );
  }
  if (meta.notesPayload) {
    note = appendSourceNoteSegment(
      note,
      "hskNotes",
      JSON.stringify(meta.notesPayload)
    );
  }
  if (meta.studyContentPayload) {
    note = appendSourceNoteSegment(
      note,
      "hskStudyContent",
      JSON.stringify(meta.studyContentPayload)
    );
  }
  if (options?.lessonJson && isRecord(options.lessonJson)) {
    const teaching = extractHskLessonTeachingPayload(options.lessonJson);
    if (Object.keys(teaching).length > 0) {
      note = appendSourceNoteSegment(note, "hskLesson", JSON.stringify(teaching));
    }
  }
  if (options?.audioManifest) {
    note = appendSourceNoteSegment(
      note,
      "hskAudioManifest",
      JSON.stringify(options.audioManifest)
    );
  }

  return note;
}

const HSK_LESSON_META_KEYS = new Set([
  "title",
  "mongolianTitle",
  "chineseTitle",
  "targetTitle",
  "subtitle",
  "description",
  "duration",
  "orderIndex",
  "order_index",
  "status",
  "thumbnailFile",
  "audioFile",
  "videoFile",
  "courseId",
  "lessonId",
  "language",
  "mediaStatus",
]);

function extractHskLessonTeachingPayload(
  lessonJson: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lessonJson)) {
    if (HSK_LESSON_META_KEYS.has(key)) continue;
    if (isNonEmpty(value)) out[key] = value;
  }
  return out;
}

export function normalizeChineseHskVocabularyRow(
  item: Record<string, unknown>,
  index: number,
  errors: string[],
  warnings: string[]
): Record<string, unknown> | null {
  const chinese =
    trim(item.chinese) || trim(item.target) || trim(item.word);
  const mongolian = trim(item.mongolian);
  const pinyin =
    trim(item.pinyin) || trim(item.reading) || trim(item.romanization) || null;

  if (!chinese) {
    errors.push(`vocabulary[${index}]: chinese is required.`);
    return null;
  }
  if (!mongolian) {
    errors.push(`vocabulary[${index}]: mongolian is required.`);
    return null;
  }

  if (!pinyin) {
    warnings.push(`vocabulary[${index}] "${chinese}": pinyin missing (recommended).`);
  }

  const examplePinyin =
    trim(item.examplePinyin ?? item.example_pinyin) || null;
  const notes = trim(item.notes) || undefined;
  const tags = Array.isArray(item.tags)
    ? item.tags.filter((tag): tag is string => typeof tag === "string")
    : undefined;
  const sourceRef = trim(item.sourceRef ?? item.source_ref) || undefined;

  return {
    ...item,
    chinese,
    pinyin,
    mongolian,
    hskLevel:
      trim(item.hskLevel ?? item.hsk_level ?? item.level) || undefined,
    exampleChinese:
      trim(item.exampleChinese ?? item.example_chinese ?? item.example) || null,
    examplePinyin,
    exampleMongolian:
      trim(item.exampleMongolian ?? item.example_mongolian) || null,
    notes,
    tags,
    sourceRef,
  };
}

export function sectionIsPresent(
  sections: ChineseHskSectionInventory,
  sectionKey: string
): boolean {
  if (isNonEmpty(sections[sectionKey])) return true;

  if (sectionKey === "vocabulary" || sectionKey === "basicWords") {
    return ["vocabulary", "basicWords", "expansionVocabulary"].some((key) =>
      isNonEmpty(sections[key])
    );
  }

  if (sectionKey === "quiz" || sectionKey === "miniQuiz") {
    return ["quiz", "miniQuiz"].some((key) => isNonEmpty(sections[key]));
  }

  if (sectionKey === "grammarPatterns") {
    return isNonEmpty(sections.grammarPatterns) || isNonEmpty(sections.grammarNotes);
  }

  if (sectionKey === "grammarNotes") {
    return isNonEmpty(sections.grammarNotes) || isNonEmpty(sections.grammarPatterns);
  }

  if (sectionKey === "texts") {
    return (
      isNonEmpty(sections.texts) ||
      isNonEmpty(sections.dialogues) ||
      isNonEmpty(sections.mainText) ||
      isNonEmpty(sections.longText)
    );
  }

  if (sectionKey === "mainText") {
    return isNonEmpty(sections.mainText) || isNonEmpty(sections.longText);
  }

  if (sectionKey === "longText") {
    return isNonEmpty(sections.longText) || isNonEmpty(sections.mainText);
  }

  return false;
}
