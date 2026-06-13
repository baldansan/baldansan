import {
  applyLessonPackageAudioUrls,
  buildLessonPackageAudioPublicBase,
  pickPackageAudioPath,
  resolveStorageLessonIdForAudio,
} from "@/lib/lesson/package-audio-resolve";
import { exerciseSourceHasPlayerContent } from "@/lib/lesson/build-exercise-questions";
import {
  listeningItemCount,
  resolveExercisesWorkbook,
  workbookExercisesHasContent,
} from "@/lib/lesson/workbook-exercises";
import { parseTagFromSourceNote } from "@/lib/lesson-content-type";
import {
  parseHskStudyContentFromLesson,
  type HskDialogue,
} from "@/lib/lesson/hsk-lesson-content";
import {
  parseLegacySourceNoteJsonSegment,
  parseLessonSourceNote,
} from "@/lib/lesson/source-note-json";
import { normalizeCharactersPayload } from "@/lib/hanzi/normalize-characters";
import type {
  HskLessonPackage,
  HskPackageCollocation,
  HskPackageDialogue,
  HskPackageGrammarPoint,
  HskPackageGrammarExercise,
  HskGrammarExerciseType,
  HskPackageModuleKey,
  HskPackageParagraphSummary,
  HskPackageShortText,
  HskPackageWritingSample,
  HskPackageTextReflection,
  HskPackageTextSentence,
  HskPackageTextToken,
  HskPackageVocabItem,
  HskTeacherCheckQuiz,
  HskTeacherCommonMistake,
  HskTeacherOverlayFields,
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

function mapDialogueLines(raw: unknown): HskPackageDialogue["lines"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((line) => ({
      speaker: trim(line.speaker) || "",
      zh: trim(line.zh) || trim(line.chinese),
      pinyin: trim(line.pinyin),
      mn: trim(line.mn) || trim(line.mongolian),
    }))
    .filter((line) => line.zh || line.mn);
}

function normalizePackageDialogue(raw: unknown, index: number): HskPackageDialogue | null {
  if (!isRecord(raw)) return null;
  const lines = mapDialogueLines(raw.lines);
  if (lines.length === 0) return null;
  const audio = pickPackageAudioPath(raw);
  return {
    id: Number(raw.id) || index + 1,
    title_mn: trim(raw.title_mn) || trim(raw.title) || undefined,
    scene_mn: trim(raw.scene_mn) || undefined,
    audio,
    lines,
  };
}

function normalizePackageDialogues(raw: unknown): HskPackageDialogue[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => normalizePackageDialogue(item, index))
    .filter((row): row is HskPackageDialogue => row !== null);
}

function resolvePackageDialogues(
  teaching: Record<string, unknown> | null,
  textsPayload: unknown,
  studyDialogues: HskDialogue[]
): HskPackageDialogue[] {
  if (teaching && Array.isArray(teaching.dialogues)) {
    const fromTeaching = normalizePackageDialogues(teaching.dialogues);
    if (fromTeaching.length > 0) return fromTeaching;
  }
  if (isRecord(textsPayload) && Array.isArray(textsPayload.dialogues)) {
    const fromTexts = normalizePackageDialogues(textsPayload.dialogues);
    if (fromTexts.length > 0) return fromTexts;
  }
  return mapDialogues(studyDialogues);
}

function resolvePackageCharacters(
  pkg: Partial<HskLessonPackage>,
  teaching: Record<string, unknown> | null,
  studyCharacters: unknown
): HskLessonPackage["characters"] | undefined {
  const fromPkg = normalizeCharactersPayload(pkg.characters);
  if (fromPkg) return fromPkg;

  const fromTeaching = normalizeCharactersPayload(teaching?.characters);
  if (fromTeaching) return fromTeaching;

  return normalizeCharactersPayload(studyCharacters);
}

function resolvePackageTexts(
  teaching: Record<string, unknown> | null,
  textsPayload: unknown
): HskPackageShortText[] {
  if (teaching && Array.isArray(teaching.texts)) {
    const fromTeaching = normalizePackageTexts(teaching.texts);
    if (fromTeaching.length > 0) return fromTeaching;
  }
  return mapTexts(textsPayload ?? teaching?.texts);
}

/** Fill dialogues/texts + audio from lessonTeaching / texts.json when embedded package lacks them. */
function enrichPackageFromStudyTeaching(
  pkg: HskLessonPackage,
  lesson: LessonContent
): HskLessonPackage {
  const {
    teaching,
    texts,
    grammar,
    notes,
    sections,
    characters: studyCharacters,
  } = getStudyPayloads(lesson.sourceNote);
  const study = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);

  const dialogues =
    pkg.dialogues?.length &&
    pkg.dialogues.some((d) => pickPackageAudioPath(d as unknown as Record<string, unknown>))
      ? normalizePackageDialogues(pkg.dialogues)
      : resolvePackageDialogues(teaching, texts, study.dialogues);

  const fromStudy = resolvePackageTexts(teaching, texts);
  const fromPkg = pkg.texts?.length ? normalizePackageTexts(pkg.texts) : [];
  const textsOut =
    fromStudy.some((t) => t.sentences.length > 0) && fromStudy.length > 0
      ? fromStudy
      : fromPkg.some((t) => t.sentences.length > 0) && fromPkg.length > 0
        ? fromPkg
        : fromStudy.length > 0
          ? fromStudy
          : fromPkg;

  const characters = resolvePackageCharacters(pkg, teaching, studyCharacters);

  const resolvedWordExplanation = resolveWordExplanation(
    teaching,
    texts,
    grammar,
    notes,
    sections
  );
  const word_explanation =
    resolvedWordExplanation.length > 0
      ? resolvedWordExplanation
      : pkg.word_explanation?.length
        ? normalizeGrammarPoints(pkg.word_explanation)
        : undefined;

  const parsedNote = parseLessonSourceNote(lesson.sourceNote);
  const studyRecord =
    parsedNote.format === "json" && isRecord(parsedNote.data.hskStudyContent)
      ? (parsedNote.data.hskStudyContent as Record<string, unknown>)
      : null;
  const resolvedCollocations = resolveCollocations(teaching, studyRecord, sections);
  const collocations =
    resolvedCollocations.length > 0 ? resolvedCollocations : pkg.collocations;

  return {
    ...pkg,
    dialogues: dialogues.length > 0 ? dialogues : pkg.dialogues,
    texts: textsOut.length > 0 ? textsOut : pkg.texts,
    characters: characters ?? pkg.characters,
    word_explanation,
    collocations,
  };
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

function normalizeTextToken(raw: unknown): HskPackageTextToken | null {
  if (!isRecord(raw)) return null;
  const zh = trim(raw.zh);
  if (!zh) return null;
  return {
    zh,
    py: trim(raw.py) || trim(raw.pinyin),
  };
}

function tokenizeZhForLegacyText(zh: string): HskPackageTextToken[] {
  const out: HskPackageTextToken[] = [];
  let i = 0;
  while (i < zh.length) {
    const ch = zh[i]!;
    if (!/\S/.test(ch) || !/[\u4e00-\u9fff]/.test(ch)) {
      i += 1;
      continue;
    }
    out.push({ zh: ch, py: "" });
    i += 1;
  }
  return out;
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(trim).filter(Boolean);
}

function parseParagraphSummaries(value: unknown): HskPackageParagraphSummary[] {
  if (!Array.isArray(value)) return [];
  const out: HskPackageParagraphSummary[] = [];
  let fallbackParagraph = 1;

  for (const item of value) {
    if (typeof item === "string") {
      const mn = item.trim();
      if (!mn) continue;
      out.push({ paragraph: fallbackParagraph, mn });
      fallbackParagraph += 1;
      continue;
    }
    if (!isRecord(item)) continue;

    const mn =
      trim(item.mn) ||
      trim(item.text) ||
      trim(item.summary) ||
      trim(item.mongolian);
    if (!mn) continue;

    const paragraphNum = Number(item.paragraph);
    const paragraph =
      Number.isFinite(paragraphNum) && paragraphNum > 0
        ? Math.floor(paragraphNum)
        : fallbackParagraph;

    out.push({ paragraph, mn });
    fallbackParagraph = Math.max(fallbackParagraph, paragraph + 1);
  }

  return out;
}

function parseTeacherOverlayFields(
  item: Record<string, unknown>
): HskTeacherOverlayFields {
  const structure = trim(item.structure);
  const teacher_notes = trim(item.teacher_notes) || trim(item.teacherNotes);
  const mistakesRaw = item.common_mistakes ?? item.commonMistakes;
  let common_mistakes: HskTeacherCommonMistake[] | undefined;
  if (Array.isArray(mistakesRaw)) {
    const rows = mistakesRaw
      .filter(isRecord)
      .map((row) => ({
        wrong: trim(row.wrong),
        right: trim(row.right) || trim(row.correct),
        why: trim(row.why) || undefined,
      }))
      .filter((row) => row.wrong || row.right);
    if (rows.length > 0) common_mistakes = rows;
  }

  let check: HskTeacherCheckQuiz | undefined;
  const checkRaw = item.check;
  if (isRecord(checkRaw)) {
    const question = trim(checkRaw.question);
    const answer = trim(checkRaw.answer);
    const options = parseStringList(checkRaw.options);
    if (question && options.length > 0 && answer) {
      check = { question, options, answer };
    }
  }

  return {
    structure: structure || undefined,
    teacher_notes: teacher_notes || undefined,
    common_mistakes,
    check,
  };
}

function normalizeTextSentence(raw: unknown): HskPackageTextSentence | null {
  if (!isRecord(raw)) return null;
  const zh = trim(raw.zh) || trim(raw.chinese);
  const pinyin = trim(raw.pinyin);
  const mn = trim(raw.mn) || trim(raw.mongolian);
  const note = trim(raw.note);
  const key_structures = parseStringList(raw.key_structures ?? raw.keyStructures);
  const hadAuthorTokens = Array.isArray(raw.tokens) && raw.tokens.length > 0;
  let tokens: HskPackageTextToken[] = [];
  if (hadAuthorTokens && Array.isArray(raw.tokens)) {
    tokens = raw.tokens
      .map((item) => normalizeTextToken(item))
      .filter((row): row is HskPackageTextToken => row !== null);
  }
  if (tokens.length === 0 && zh) {
    tokens = tokenizeZhForLegacyText(zh);
  }
  const zhJoined = zh || tokens.map((t) => t.zh).join("");
  if (!zhJoined && !mn) return null;
  return {
    zh: zhJoined,
    pinyin,
    mn,
    tokens,
    note: note || undefined,
    key_structures: key_structures.length > 0 ? key_structures : undefined,
    word_tap: hadAuthorTokens ? true : undefined,
  };
}

function parseTextReflection(raw: unknown): HskPackageTextReflection | undefined {
  if (!isRecord(raw)) return undefined;
  const questions_mn = parseStringList(raw.questions_mn ?? raw.questionsMn);
  if (questions_mn.length === 0) return undefined;
  return { questions_mn };
}

function legacyFlatTextToSentences(
  zh: string,
  pinyin: string,
  mn: string
): HskPackageTextSentence[] {
  const chunks = zh
    .split(/(?<=[。！？!?；;])/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (chunks.length === 0 && zh) {
    return [normalizeTextSentence({ zh, pinyin, mn })!].filter(Boolean);
  }
  if (chunks.length <= 1) {
    const row = normalizeTextSentence({ zh, pinyin, mn });
    return row ? [row] : [];
  }
  return chunks
    .map((part) => normalizeTextSentence({ zh: part, pinyin: "", mn: "" }))
    .filter((row): row is HskPackageTextSentence => row !== null);
}

function parseWritingSample(raw: unknown): HskPackageWritingSample | undefined {
  if (!isRecord(raw)) return undefined;
  const zh = trim(raw.zh) || trim(raw.chinese);
  if (!zh) return undefined;
  return {
    title_mn: trim(raw.title_mn) || trim(raw.titleMn) || undefined,
    zh,
    pinyin: trim(raw.pinyin) || undefined,
    mn: trim(raw.mn) || trim(raw.mongolian) || undefined,
  };
}

function parseGrammarExercises(raw: unknown): HskPackageGrammarExercise[] {
  if (!Array.isArray(raw)) return [];
  const out: HskPackageGrammarExercise[] = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const typeRaw = trim(row.type).toLowerCase();
    if (typeRaw !== "choice" && typeRaw !== "fill" && typeRaw !== "judge") continue;
    const type = typeRaw as HskGrammarExerciseType;
    const question =
      trim(row.question) || trim(row.q) || trim(row.prompt) || trim(row.statement);
    if (!question) continue;

    const optionsRaw = row.options;
    const options = Array.isArray(optionsRaw)
      ? optionsRaw.map((o) => String(o).trim()).filter(Boolean)
      : undefined;

    let answer: string | number | boolean = row.answer as string | number | boolean;
    if (answer == null || answer === "") {
      if (type === "judge" && row.correct != null) {
        answer = row.correct as boolean;
      } else {
        continue;
      }
    }

    out.push({
      type,
      question,
      options: options?.length ? options : undefined,
      answer,
      explanation_correct_mn:
        trim(row.explanation_correct_mn) ||
        trim(row.explanationCorrectMn) ||
        trim(row.why_correct_mn) ||
        undefined,
      explanation_wrong_mn:
        trim(row.explanation_wrong_mn) ||
        trim(row.explanationWrongMn) ||
        trim(row.why_wrong_mn) ||
        undefined,
    });
  }
  return out;
}

function normalizePackageText(raw: unknown, index: number): HskPackageShortText | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id) || index + 1;
  const audio = pickPackageAudioPath(raw);
  const title_mn = trim(raw.title_mn) || trim(raw.titleMn) || undefined;
  const writingSample = parseWritingSample(raw.writingSample);

  const paragraph_summaries = parseParagraphSummaries(
    raw.paragraph_summaries ?? raw.paragraphSummaries
  );
  const reflection = parseTextReflection(raw.reflection);

  if (Array.isArray(raw.sentences) && raw.sentences.length > 0) {
    const sentences = raw.sentences
      .map((item) => normalizeTextSentence(item))
      .filter((row): row is HskPackageTextSentence => row !== null);
    if (sentences.length === 0 && !writingSample) return null;
    return {
      id,
      title_mn,
      audio,
      sentences,
      paragraph_summaries:
        paragraph_summaries.length > 0 ? paragraph_summaries : undefined,
      reflection,
      writingSample,
    };
  }

  const zh = trim(raw.zh) || trim(raw.chinese);
  const mn = trim(raw.mn) || trim(raw.mongolian);
  const pinyin = trim(raw.pinyin);
  if (!zh && !mn && !writingSample) return null;
  const sentences =
    zh || mn ? legacyFlatTextToSentences(zh, pinyin, mn) : [];
  if (sentences.length === 0 && !writingSample) return null;
  return {
    id,
    title_mn,
    audio,
    sentences,
    paragraph_summaries:
      paragraph_summaries.length > 0 ? paragraph_summaries : undefined,
    reflection,
    writingSample,
  };
}

function normalizePackageTexts(raw: unknown): HskPackageShortText[] {
  if (!Array.isArray(raw)) return mapTexts(raw);
  return raw
    .map((item, index) => normalizePackageText(item, index))
    .filter((row): row is HskPackageShortText => row !== null);
}

function mapTexts(raw: unknown): HskPackageShortText[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => normalizePackageText(item, index))
      .filter((row): row is HskPackageShortText => row !== null);
  }

  if (!isRecord(raw)) return [];

  for (const key of ["mainText", "longText"]) {
    const nested = raw[key];
    if (nested != null) {
      const fromArticle = normalizePackageText(nested, 0);
      if (fromArticle) return [fromArticle];
    }
  }

  for (const key of ["shortTexts", "texts", "readings", "passages"]) {
    const nested = raw[key];
    if (Array.isArray(nested)) {
      return mapTexts(nested);
    }
  }

  return [];
}

function mapGrammar(raw: unknown): HskPackageGrammarPoint[] {
  if (!raw) return [];

  const points: HskPackageGrammarPoint[] = [];

  const pushPoint = (item: Record<string, unknown>, index: number) => {
    const point =
      trim(item.point) ||
      trim(item.pattern) ||
      trim(item.title) ||
      trim(item.word) ||
      trim(item.zh);
    const gloss =
      trim(item.gloss_mn) ||
      trim(item.glossMn) ||
      trim(item.mongolian) ||
      trim(item.meaning_mn) ||
      trim(item.meaningMn);
    const teacher =
      trim(item.teacher_mn) ||
      trim(item.teacherMn) ||
      trim(item.explanation) ||
      trim(item.body_mn) ||
      trim(item.bodyMn);
    const overlay = parseTeacherOverlayFields(item);
    const exercises = parseGrammarExercises(item.exercises);
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

    if (
      !point &&
      !gloss &&
      examples.length === 0 &&
      exercises.length === 0 &&
      !overlay.structure &&
      !overlay.teacher_notes &&
      !overlay.common_mistakes?.length &&
      !overlay.check
    ) {
      return;
    }

    points.push({
      point: point || `Grammar ${index + 1}`,
      gloss_mn: gloss || point,
      teacher_mn: teacher || gloss || point,
      examples,
      exercises: exercises.length > 0 ? exercises : undefined,
      ...overlay,
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

function normalizeGrammarPoints(raw: unknown): HskPackageGrammarPoint[] {
  if (!Array.isArray(raw)) return mapGrammar(raw);
  return raw
    .filter(isRecord)
    .map((item, index) => {
      const mapped = mapGrammar([item]);
      if (mapped.length > 0) return mapped[0]!;
      const overlay = parseTeacherOverlayFields(item);
      const exercises = parseGrammarExercises(item.exercises);
      const point =
        trim(item.point) ||
        trim(item.pattern) ||
        trim(item.title) ||
        trim(item.word) ||
        trim(item.zh) ||
        `Grammar ${index + 1}`;
      return {
        point,
        gloss_mn: trim(item.gloss_mn) || trim(item.glossMn) || point,
        teacher_mn:
          trim(item.teacher_mn) ||
          trim(item.teacherMn) ||
          trim(item.explanation) ||
          point,
        examples: [],
        exercises: exercises.length > 0 ? exercises : undefined,
        ...overlay,
      };
    });
}

function resolveWordExplanation(
  teaching: Record<string, unknown> | null,
  textsPayload: unknown,
  grammarPayload: unknown,
  notesPayload: unknown,
  sections: Record<string, unknown> | null
): HskPackageGrammarPoint[] {
  const candidates: unknown[] = [
    teaching?.wordExplanation,
    teaching?.word_explanation,
    isRecord(textsPayload) ? textsPayload.wordExplanation : null,
    isRecord(textsPayload) ? textsPayload.word_explanation : null,
    isRecord(grammarPayload) ? grammarPayload.wordExplanation : null,
    isRecord(notesPayload) ? notesPayload.wordExplanation : null,
    sections?.wordExplanation,
    sections?.word_explanation,
  ];
  for (const candidate of candidates) {
    const mapped = mapGrammar(candidate);
    if (mapped.length > 0) return mapped;
  }
  return [];
}

function resolveCollocations(
  teaching: Record<string, unknown> | null,
  study: Record<string, unknown> | null,
  sections: Record<string, unknown> | null
): HskPackageCollocation[] {
  const raw =
    teaching?.collocations ??
    study?.collocations ??
    sections?.collocations ??
    null;
  if (!Array.isArray(raw)) return [];

  const out: HskPackageCollocation[] = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const zh = trim(row.zh);
    if (!zh) continue;
    const exampleRaw = row.example;
    const example = isRecord(exampleRaw)
      ? {
          zh: trim(exampleRaw.zh),
          pinyin: trim(exampleRaw.pinyin) || undefined,
          mn: trim(exampleRaw.mn) || undefined,
        }
      : undefined;
    out.push({
      zh,
      mn: trim(row.mn) || undefined,
      usage_mn: trim(row.usage_mn) || trim(row.usageMn) || undefined,
      example:
        example && example.zh
          ? example
          : undefined,
    });
  }
  return out;
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
  "characters",
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
    case "characters":
      return (pkg.characters?.characters?.length ?? 0) > 0;
    case "grammar":
      return (
        (pkg.grammar?.length ?? 0) > 0 || (pkg.word_explanation?.length ?? 0) > 0
      );
    case "exercises_textbook":
      return exerciseSourceHasPlayerContent(
        pkg as HskLessonPackage,
        "textbook"
      );
    case "exercises_workbook":
      return workbookExercisesHasContent(pkg.exercises_workbook);
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
  if (workbookExercisesHasContent(pkg.exercises_workbook)) {
    declaredSet.add("exercises_workbook");
  }
  if (exerciseSourceHasPlayerContent(pkg as HskLessonPackage, "textbook")) {
    declaredSet.add("exercises_textbook");
  }

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

/** Map import `audioFile` → `audio` and normalize dialogue/text rows for LessonPlayer. */
function normalizeLessonPackageMedia(pkg: HskLessonPackage): HskLessonPackage {
  return {
    ...pkg,
    dialogues: pkg.dialogues
      ? normalizePackageDialogues(pkg.dialogues)
      : undefined,
    texts: pkg.texts ? normalizePackageTexts(pkg.texts) : undefined,
  };
}

function resolvePackageAudioBasePath(
  lesson: LessonContent,
  pkg: HskLessonPackage
): string | undefined {
  if (trim(lesson.courseId).toLowerCase() === "hsk5") {
    return undefined;
  }
  const publicBase = buildLessonPackageAudioPublicBase(
    lesson.courseId,
    resolveStorageLessonIdForAudio(lesson)
  );
  if (publicBase) return publicBase;
  const fromPkg = trim(pkg.audio_base_path);
  return fromPkg || undefined;
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

/** Rebuild workbook.json shape when import flattened listening onto hskStudyContent. */
function workbookPayloadFromStudyRecord(
  study: Record<string, unknown>
): Record<string, unknown> | null {
  if (isRecord(study.workbook)) {
    return study.workbook as Record<string, unknown>;
  }

  const listening = study.workbookListening ?? study.listening;
  const reading = study.workbookReading ?? study.reading;
  const writing = study.workbookWriting ?? study.writing;
  if (!listening && !reading && !writing) return null;

  const out: Record<string, unknown> = {};
  if (listening) out.listening = listening;
  if (reading) out.reading = reading;
  if (writing) out.writing = writing;
  return out;
}

function resolveWorkbookPayloadFromSourceNote(
  sourceNote: string | undefined | null
): unknown {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") {
    return parseLegacySourceNoteJsonSegment(sourceNote, "hskWorkbook");
  }

  const data = parsed.data;
  const study = isRecord(data.hskStudyContent) ? data.hskStudyContent : null;
  if (study) {
    const fromStudy = workbookPayloadFromStudyRecord(study);
    if (fromStudy) return fromStudy;
  }

  if (data.hskWorkbook != null) return data.hskWorkbook;
  if (data.workbook != null) return data.workbook;

  const sections = data.sections;
  if (isRecord(sections)) {
    const listening = sections.workbookListening ?? sections.listening;
    const reading = sections.workbookReading ?? sections.reading;
    const writing = sections.workbookWriting ?? sections.writing;
    if (listening || reading || writing) {
      const out: Record<string, unknown> = {};
      if (listening) out.listening = listening;
      if (reading) out.reading = reading;
      if (writing) out.writing = writing;
      return out;
    }
  }

  return parseLegacySourceNoteJsonSegment(sourceNote, "hskWorkbook");
}

function getStudyPayloads(sourceNote: string | undefined | null) {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json" || !isRecord(parsed.data.hskStudyContent)) {
    return {
      teaching: null as Record<string, unknown> | null,
      texts: null as unknown,
      grammar: null as unknown,
      notes: null as unknown,
      sections: null as Record<string, unknown> | null,
      characters: null as unknown,
      workbook: resolveWorkbookPayloadFromSourceNote(sourceNote),
    };
  }

  const study = parsed.data.hskStudyContent;
  const teaching = isRecord(study.lessonTeaching)
    ? study.lessonTeaching
    : isRecord(study.lessonPayload)
      ? study.lessonPayload
      : null;

  const characters =
    study.characters ??
    (teaching && isRecord(teaching) ? teaching.characters : null);

  const sections = isRecord(parsed.data.sections) ? parsed.data.sections : null;

  return {
    teaching,
    texts: study.texts,
    grammar: study.grammar,
    notes: study.notes,
    sections,
    characters,
    workbook: resolveWorkbookPayloadFromSourceNote(sourceNote),
  };
}

function buildHskLessonPackageFromLessonContent(
  lesson: LessonContent
): HskLessonPackage | null {
  const embedded = extractHskLessonPackageFromSourceNote(lesson.sourceNote);
  if (embedded) {
    return withOrderedModules(enrichPackageFromStudyTeaching(embedded, lesson));
  }

  const study = lesson.hskStudy ?? parseHskStudyContentFromLesson(lesson);
  const {
    teaching,
    texts,
    grammar,
    notes,
    sections,
    workbook,
    characters: studyCharacters,
  } = getStudyPayloads(lesson.sourceNote);

  const vocabulary =
    teaching && Array.isArray(teaching.vocabulary)
      ? (teaching.vocabulary as HskPackageVocabItem[])
      : mapVocabulary(lesson);

  const dialogues = resolvePackageDialogues(teaching, texts, study.dialogues);

  const mappedTexts = resolvePackageTexts(teaching, texts);

  const mappedGrammar =
    teaching && Array.isArray(teaching.grammar)
      ? normalizeGrammarPoints(teaching.grammar)
      : mapGrammar(grammar ?? teaching?.grammar);

  const wordExplanation = resolveWordExplanation(
    teaching,
    texts,
    grammar,
    notes,
    sections
  );

  const parsedNote = parseLessonSourceNote(lesson.sourceNote);
  const studyRecord =
    parsedNote.format === "json" && isRecord(parsedNote.data.hskStudyContent)
      ? (parsedNote.data.hskStudyContent as Record<string, unknown>)
      : null;
  const collocations = resolveCollocations(teaching, studyRecord, sections);

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
    characters: resolvePackageCharacters({}, teaching, studyCharacters),
    dialogues: dialogues.length > 0 ? dialogues : undefined,
    texts: mappedTexts.length > 0 ? mappedTexts : undefined,
    pronunciation: teaching?.pronunciation,
    grammar: mappedGrammar.length > 0 ? mappedGrammar : undefined,
    word_explanation:
      wordExplanation.length > 0 ? wordExplanation : undefined,
    collocations: collocations.length > 0 ? collocations : undefined,
    exercises_textbook: teaching?.exercises_textbook,
    exercises_workbook: resolveExercisesWorkbook(teaching, workbook),
    recap: teaching?.recap,
    proper_nouns: Array.isArray(teaching?.proper_nouns)
      ? (teaching.proper_nouns as HskLessonPackage["proper_nouns"])
      : undefined,
  };

  return withOrderedModules(partial);
}

function enrichPackageWorkbookExercises(
  pkg: HskLessonPackage,
  lesson: LessonContent
): HskLessonPackage {
  const { teaching, workbook } = getStudyPayloads(lesson.sourceNote);
  const exercises_workbook = resolveExercisesWorkbook(
    teaching,
    workbook,
    pkg.exercises_workbook
  );
  if (!exercises_workbook) return pkg;

  const prevEb = isRecord(pkg.exercises_workbook) ? pkg.exercises_workbook : {};
  const prevListening = listeningItemCount(prevEb);
  const nextListening = listeningItemCount(exercises_workbook);
  if (
    exercises_workbook === pkg.exercises_workbook &&
    nextListening === prevListening
  ) {
    return pkg;
  }

  return withOrderedModules({ ...pkg, exercises_workbook });
}

/** Resolve Gold Standard package for schema-driven LessonPlayer. */
export function resolveHskLessonPackageFromLesson(
  lesson: LessonContent
): HskLessonPackage | null {
  const fromSource = extractHskLessonPackageFromSourceNote(lesson.sourceNote);
  const raw = fromSource ?? buildHskLessonPackageFromLessonContent(lesson);
  if (!raw) return null;
  const withStudy = enrichPackageFromStudyTeaching(raw, lesson);
  const withWorkbook = enrichPackageWorkbookExercises(withStudy, lesson);
  const ordered = withOrderedModules(withWorkbook);
  const normalized = normalizeLessonPackageMedia(ordered);
  const withBase: HskLessonPackage = {
    ...normalized,
    audio_base_path:
      resolvePackageAudioBasePath(lesson, normalized) ?? normalized.audio_base_path,
  };
  return applyLessonPackageAudioUrls(withBase, lesson);
}
