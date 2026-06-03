import { applyLessonPackageAudioUrls } from "@/lib/lesson/package-audio-resolve";
import { parseTagFromSourceNote } from "@/lib/lesson-content-type";
import {
  parseHskStudyContentFromLesson,
  type HskDialogue,
} from "@/lib/lesson/hsk-lesson-content";
import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import type {
  HskLessonPackage,
  HskPackageDialogue,
  HskPackageGrammarPoint,
  HskPackageModuleKey,
  HskPackageShortText,
  HskPackageVocabItem,
} from "@/types/hsk-lesson-package";
import type { LessonContent } from "@/types/lesson-content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function isHskLessonPackageShape(value: unknown): value is HskLessonPackage {
  if (!isRecord(value)) return false;
  if (typeof value.schema_version !== "string") return false;
  if (!Array.isArray(value.modules_enabled)) return false;
  if (!isRecord(value.title)) return false;
  if (!isRecord(value.hook)) return false;
  if (!Array.isArray(value.vocabulary)) return false;
  return true;
}

function coerceHskLessonPackage(value: unknown): HskLessonPackage | null {
  if (!isHskLessonPackageShape(value)) return null;
  return value;
}

function collectPackageCandidates(sourceNote: string | undefined | null): unknown[] {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return [];

  const data = parsed.data;
  const study = data.hskStudyContent;
  const studyRecord = isRecord(study) ? study : null;

  return [
    data.hskLessonPackage,
    data.lessonPackage,
    data.goldStandardLesson,
    data.hskLesson,
    studyRecord?.lessonPackage,
    studyRecord?.lessonTeaching,
    studyRecord?.lessonPayload,
    study,
    data,
  ].filter((item) => item != null);
}

export function extractHskLessonPackageFromSourceNote(
  sourceNote: string | undefined | null
): HskLessonPackage | null {
  for (const candidate of collectPackageCandidates(sourceNote)) {
    const pkg = coerceHskLessonPackage(candidate);
    if (pkg) return pkg;
  }
  return null;
}

function mapVocabulary(lesson: LessonContent): HskPackageVocabItem[] {
  return lesson.vocabulary.map((word, index) => ({
    id: index + 1,
    zh: word.chinese,
    pinyin: word.pinyin,
    mn: word.mongolian,
    example_zh: word.exampleChinese || null,
    example_mn: word.exampleMongolian || null,
    en: word.hskLevel || undefined,
  }));
}

function mapDialogues(dialogues: HskDialogue[]): HskPackageDialogue[] {
  return dialogues.map((dialogue, index) => ({
    id: index + 1,
    title_mn: dialogue.title,
    lines: dialogue.lines.map((line) => ({
      speaker: line.speaker ?? "",
      zh: line.chinese,
      pinyin: line.pinyin ?? "",
      mn: line.mongolian ?? "",
    })),
  }));
}

function mapTexts(raw: unknown): HskPackageShortText[] {
  const rows: HskPackageShortText[] = [];

  const pushRow = (item: Record<string, unknown>, index: number) => {
    const zh = trim(item.zh) || trim(item.chinese);
    const mn = trim(item.mn) || trim(item.mongolian);
    const pinyin = trim(item.pinyin);
    if (!zh && !mn) return;
    rows.push({
      id: Number(item.id) || index + 1,
      zh,
      pinyin,
      mn,
      audio: trim(item.audio) || undefined,
    });
  };

  if (Array.isArray(raw)) {
    raw.forEach((item, index) => {
      if (isRecord(item)) pushRow(item, index);
    });
    return rows;
  }

  if (!isRecord(raw)) return rows;

  for (const key of ["texts", "readings", "shortTexts", "passages"]) {
    const nested = raw[key];
    if (Array.isArray(nested)) {
      return mapTexts(nested);
    }
  }

  return rows;
}

function mapGrammar(raw: unknown): HskPackageGrammarPoint[] {
  if (!raw) return [];

  const points: HskPackageGrammarPoint[] = [];

  const pushPoint = (item: Record<string, unknown>, index: number) => {
    const point = trim(item.point) || trim(item.pattern) || trim(item.title);
    const gloss = trim(item.gloss_mn) || trim(item.glossMn) || trim(item.mongolian);
    const teacher = trim(item.teacher_mn) || trim(item.teacherMn) || trim(item.explanation);
    const examplesRaw = item.examples ?? item.example ?? item.samples;
    const examples = Array.isArray(examplesRaw)
      ? examplesRaw
          .filter(isRecord)
          .map((ex) => ({
            zh: trim(ex.zh) || trim(ex.chinese),
            pinyin: trim(ex.pinyin),
            mn: trim(ex.mn) || trim(ex.mongolian),
          }))
          .filter((ex) => ex.zh || ex.mn)
      : [];

    if (!point && !gloss && examples.length === 0) return;

    points.push({
      point: point || `Grammar ${index + 1}`,
      gloss_mn: gloss || point,
      teacher_mn: teacher || gloss || point,
      examples,
    });
  };

  if (Array.isArray(raw)) {
    raw.forEach((item, index) => {
      if (isRecord(item)) pushPoint(item, index);
    });
    return points;
  }

  if (isRecord(raw)) {
    if (Array.isArray(raw.points)) return mapGrammar(raw.points);
    if (Array.isArray(raw.grammarPoints)) return mapGrammar(raw.grammarPoints);
    if (Array.isArray(raw.patterns)) return mapGrammar(raw.patterns);
    pushPoint(raw, 0);
  }

  return points;
}

/**
 * Standard HSK study module order for every lesson (LessonPlayer index order).
 * Import ZIP / lesson.json may list modules differently — always normalize via
 * `resolveModulesEnabled()`.
 */
export const HSK_LESSON_MODULE_ORDER: readonly HskPackageModuleKey[] = [
  "hook",
  "dialogues",
  "pronunciation",
  "texts",
  "vocabulary",
  "grammar",
  "exercises_textbook",
  "exercises_workbook",
  "recap",
];

function hasPronunciationContent(pronunciation: unknown): boolean {
  if (!pronunciation || typeof pronunciation !== "object") return false;
  const record = pronunciation as Record<string, unknown>;
  if (Array.isArray(record.items) && record.items.length > 0) return true;
  if (trim(record.teacher_mn)) return true;
  return Object.keys(record).length > 0;
}

function hasRecapContent(recap: unknown): boolean {
  if (!recap || typeof recap !== "object") return false;
  return Object.keys(recap as Record<string, unknown>).length > 0;
}

function hasExerciseContent(exercises: unknown): boolean {
  if (!exercises || typeof exercises !== "object") return false;
  return Object.keys(exercises as Record<string, unknown>).length > 0;
}

/** True when the lesson package has learner-facing content for this module. */
export function moduleHasContent(
  pkg: Partial<HskLessonPackage>,
  key: HskPackageModuleKey
): boolean {
  switch (key) {
    case "hook":
      return true;
    case "dialogues":
      return (pkg.dialogues?.length ?? 0) > 0;
    case "pronunciation":
      return hasPronunciationContent(pkg.pronunciation);
    case "texts":
      return (pkg.texts?.length ?? 0) > 0;
    case "vocabulary":
      return (pkg.vocabulary?.length ?? 0) > 0;
    case "grammar":
      return (pkg.grammar?.length ?? 0) > 0;
    case "exercises_textbook":
      return hasExerciseContent(pkg.exercises_textbook);
    case "exercises_workbook":
      return hasExerciseContent(pkg.exercises_workbook);
    case "recap":
      return hasRecapContent(pkg.recap);
    default:
      return false;
  }
}

/** Apply {@link HSK_LESSON_MODULE_ORDER} and drop modules with no content. */
export function resolveModulesEnabled(
  pkg: Partial<HskLessonPackage>
): HskPackageModuleKey[] {
  const declared = pkg.modules_enabled?.length
    ? pkg.modules_enabled
    : [...HSK_LESSON_MODULE_ORDER];
  const declaredSet = new Set(declared);

  const ordered = HSK_LESSON_MODULE_ORDER.filter(
    (key) => declaredSet.has(key) && moduleHasContent(pkg, key)
  );

  for (const key of declared) {
    if (
      !HSK_LESSON_MODULE_ORDER.includes(key) &&
      moduleHasContent(pkg, key) &&
      !ordered.includes(key)
    ) {
      ordered.push(key);
    }
  }

  return ordered;
}

function withOrderedModules(pkg: HskLessonPackage): HskLessonPackage {
  return {
    ...pkg,
    modules_enabled: resolveModulesEnabled(pkg),
  };
}

function resolveLevel(lesson: LessonContent, teaching: Record<string, unknown> | null): string {
  const fromTeaching = teaching ? trim(teaching.level) : "";
  if (fromTeaching) return fromTeaching;

  const fromNote = parseTagFromSourceNote(lesson.sourceNote, "hskLevel");
  if (fromNote) return `HSK${fromNote}`;

  const course = lesson.courseId.toUpperCase();
  if (course.includes("HSK")) return course.replace(/-/g, "");
  return "HSK";
}

function resolveLessonNumber(
  lesson: LessonContent,
  teaching: Record<string, unknown> | null
): number {
  const fromTeaching = teaching?.lesson_number ?? teaching?.lessonNumber;
  if (fromTeaching != null && Number.isFinite(Number(fromTeaching))) {
    return Math.max(1, Math.floor(Number(fromTeaching)));
  }

  const fromNote = parseTagFromSourceNote(lesson.sourceNote, "lessonNumber");
  if (fromNote && Number.isFinite(Number(fromNote))) {
    return Math.max(1, Math.floor(Number(fromNote)));
  }

  const match = lesson.id.match(/(\d+)\s*$/);
  if (match) return Math.max(1, Number(match[1]));
  return 1;
}

function getStudyPayloads(sourceNote: string | undefined | null) {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json" || !isRecord(parsed.data.hskStudyContent)) {
    return {
      teaching: null as Record<string, unknown> | null,
      texts: null as unknown,
      grammar: null as unknown,
      workbook: null as unknown,
    };
  }

  const study = parsed.data.hskStudyContent;
  const teaching = isRecord(study.lessonTeaching)
    ? study.lessonTeaching
    : isRecord(study.lessonPayload)
      ? study.lessonPayload
      : null;

  return {
    teaching,
    texts: study.texts,
    grammar: study.grammar,
    workbook: study.workbook,
  };
}

function buildHskLessonPackageFromLessonContent(
  lesson: LessonContent
): HskLessonPackage | null {
  const embedded = extractHskLessonPackageFromSourceNote(lesson.sourceNote);
  if (embedded) return embedded;

  const study = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const { teaching, texts, grammar, workbook } = getStudyPayloads(lesson.sourceNote);

  const vocabulary =
    teaching && Array.isArray(teaching.vocabulary)
      ? (teaching.vocabulary as HskPackageVocabItem[])
      : mapVocabulary(lesson);

  const dialogues =
    teaching && Array.isArray(teaching.dialogues)
      ? (teaching.dialogues as HskPackageDialogue[])
      : mapDialogues(study.dialogues);

  const mappedTexts =
    teaching && Array.isArray(teaching.texts)
      ? (teaching.texts as HskPackageShortText[])
      : mapTexts(texts ?? teaching?.texts);

  const mappedGrammar =
    teaching && Array.isArray(teaching.grammar)
      ? (teaching.grammar as HskPackageGrammarPoint[])
      : mapGrammar(grammar ?? teaching?.grammar);

  const hookRecord = isRecord(teaching?.hook) ? teaching.hook : null;
  const teacherMn =
    trim(hookRecord?.teacher_mn) ||
    study.teacherNotes.join("\n\n") ||
    lesson.description ||
    lesson.subtitle ||
    "Сайн уу.";

  const themeZh =
    trim(teaching?.theme && isRecord(teaching.theme) ? teaching.theme.zh : null) ||
    lesson.chineseTitle ||
    "主题";
  const themeMn =
    trim(teaching?.theme && isRecord(teaching.theme) ? teaching.theme.mn : null) ||
    lesson.title ||
    lesson.subtitle ||
    themeZh;

  const titleRecord = isRecord(teaching?.title) ? teaching.title : null;

  const partial: HskLessonPackage = {
    schema_version:
      trim(teaching?.schema_version) || "v2.0-mapped",
    level: resolveLevel(lesson, teaching),
    lesson_number: resolveLessonNumber(lesson, teaching),
    title: {
      zh: trim(titleRecord?.zh) || lesson.chineseTitle || lesson.title,
      mn: trim(titleRecord?.mn) || lesson.title,
      pinyin: trim(titleRecord?.pinyin) || undefined,
      en: trim(titleRecord?.en) || undefined,
    },
    theme: {
      zh: themeZh,
      mn: themeMn,
    },
    audio_base_path: trim(teaching?.audio_base_path) || undefined,
    modules_enabled: [],
    hook: {
      teacher_mn: teacherMn,
      warmup_mn: trim(hookRecord?.warmup_mn) || undefined,
    },
    vocabulary,
    dialogues: dialogues.length > 0 ? dialogues : undefined,
    texts: mappedTexts.length > 0 ? mappedTexts : undefined,
    pronunciation: teaching?.pronunciation,
    grammar: mappedGrammar.length > 0 ? mappedGrammar : undefined,
    exercises_textbook: teaching?.exercises_textbook,
    exercises_workbook: teaching?.exercises_workbook ?? workbook ?? undefined,
    recap: teaching?.recap,
    proper_nouns: Array.isArray(teaching?.proper_nouns)
      ? (teaching.proper_nouns as HskLessonPackage["proper_nouns"])
      : undefined,
  };

  return withOrderedModules(partial);
}

/** Resolve Gold Standard package for schema-driven LessonPlayer. */
export function resolveHskLessonPackageFromLesson(
  lesson: LessonContent
): HskLessonPackage | null {
  const fromSource = extractHskLessonPackageFromSourceNote(lesson.sourceNote);
  const raw = fromSource ?? buildHskLessonPackageFromLessonContent(lesson);
  if (!raw) return null;
  const ordered = withOrderedModules(raw);
  return applyLessonPackageAudioUrls(ordered, lesson);
}
