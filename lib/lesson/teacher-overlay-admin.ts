import { parseLessonSourceNote } from "@/lib/lesson/source-note-json";
import type {
  HskTeacherCheckQuiz,
  HskTeacherCommonMistake,
} from "@/types/hsk-lesson-package";

export type TeacherMistakeForm = {
  wrong: string;
  right: string;
  why: string;
};

export type TeacherCheckForm = {
  question: string;
  options: string[];
  answer: string;
};

export type TeacherGrammarItemForm = {
  key: string;
  kind: "grammar" | "wordExplanation";
  index: number;
  label: string;
  structure: string;
  teacher_notes: string;
  common_mistakes: TeacherMistakeForm[];
  check: TeacherCheckForm;
};

export type TeacherSentenceForm = {
  index: number;
  zh: string;
  note: string;
  /** Comma-separated for the form; stored as string[] in JSON */
  key_structures: string;
};

export type TeacherOverlayAdminState = {
  hasJsonSource: boolean;
  grammarItems: TeacherGrammarItemForm[];
  sentences: TeacherSentenceForm[];
  paragraph_summaries: string[];
  reflection_questions: string[];
};

export type TeacherOverlayJsonBlock = {
  structure?: string;
  teacher_notes?: string;
  common_mistakes?: HskTeacherCommonMistake[];
  check?: HskTeacherCheckQuiz;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureStudy(data: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(data.hskStudyContent)) {
    data.hskStudyContent = {};
  }
  return data.hskStudyContent as Record<string, unknown>;
}

function ensureTexts(study: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(study.texts)) {
    study.texts = {};
  }
  return study.texts as Record<string, unknown>;
}

function normalizeGrammarArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord).map((item) => ({ ...item }));
  }
  if (!isRecord(raw)) return [];
  for (const key of ["points", "grammarPoints", "patterns", "items"]) {
    if (Array.isArray(raw[key])) {
      return (raw[key] as unknown[]).filter(isRecord).map((item) => ({ ...item }));
    }
  }
  return [{ ...raw }];
}

function itemLabel(item: Record<string, unknown>, fallback: string): string {
  return (
    trim(item.point) ||
    trim(item.pattern) ||
    trim(item.title) ||
    trim(item.word) ||
    trim(item.zh) ||
    fallback
  );
}

function readMistakes(raw: unknown): TeacherMistakeForm[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .map((row) => ({
      wrong: trim(row.wrong),
      right: trim(row.right) || trim(row.correct),
      why: trim(row.why),
    }))
    .filter((row) => row.wrong || row.right);
}

function readCheck(raw: unknown): TeacherCheckForm {
  if (!isRecord(raw)) {
    return { question: "", options: [], answer: "" };
  }
  const question = trim(raw.question);
  const answer = trim(raw.answer);
  const options = Array.isArray(raw.options)
    ? raw.options.map(trim).filter(Boolean)
    : [];
  return { question, options, answer };
}

function readOverlayFromItem(item: Record<string, unknown>): {
  structure: string;
  teacher_notes: string;
  common_mistakes: TeacherMistakeForm[];
  check: TeacherCheckForm;
} {
  return {
    structure: trim(item.structure),
    teacher_notes: trim(item.teacher_notes) || trim(item.teacherNotes),
    common_mistakes: readMistakes(item.common_mistakes ?? item.commonMistakes),
    check: readCheck(item.check),
  };
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(trim).filter(Boolean);
}

function readParagraphSummaries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) out.push(text);
      continue;
    }
    if (isRecord(item)) {
      const mn = trim(item.mn) || trim(item.text);
      if (mn) out.push(mn);
    }
  }
  return out;
}

function grammarItemsFromArray(
  items: Record<string, unknown>[],
  kind: "grammar" | "wordExplanation"
): TeacherGrammarItemForm[] {
  return items.map((item, index) => {
    const overlay = readOverlayFromItem(item);
    return {
      key: `${kind}-${index}`,
      kind,
      index,
      label: itemLabel(item, kind === "grammar" ? `Дүрэм ${index + 1}` : `Үг ${index + 1}`),
      ...overlay,
    };
  });
}

function findMainTextRecord(study: Record<string, unknown>): Record<string, unknown> | null {
  const texts = study.texts;
  if (!isRecord(texts)) return null;
  const main = texts.mainText ?? texts.longText;
  return isRecord(main) ? (main as Record<string, unknown>) : null;
}

export function extractTeacherOverlayFromSourceNote(
  sourceNote: string | undefined | null
): TeacherOverlayAdminState {
  const empty: TeacherOverlayAdminState = {
    hasJsonSource: false,
    grammarItems: [],
    sentences: [],
    paragraph_summaries: [],
    reflection_questions: [],
  };

  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") return empty;

  const data = parsed.data;
  const study = isRecord(data.hskStudyContent) ? data.hskStudyContent : null;
  if (!study) return { ...empty, hasJsonSource: true };

  const grammarItems: TeacherGrammarItemForm[] = [];

  const grammarRaw =
    study.grammar ??
    (isRecord(study.lessonTeaching) ? study.lessonTeaching.grammar : null);
  grammarItems.push(
    ...grammarItemsFromArray(normalizeGrammarArray(grammarRaw), "grammar")
  );

  const texts = isRecord(study.texts) ? study.texts : null;
  const wordExpRaw = texts?.wordExplanation ?? texts?.word_explanation;
  grammarItems.push(
    ...grammarItemsFromArray(normalizeGrammarArray(wordExpRaw), "wordExplanation")
  );

  const mainText = findMainTextRecord(study);
  const sentences: TeacherSentenceForm[] = [];
  let paragraph_summaries: string[] = [];
  let reflection_questions: string[] = [];

  if (mainText) {
    if (Array.isArray(mainText.sentences)) {
      mainText.sentences.forEach((raw, index) => {
        if (!isRecord(raw)) return;
        const keyStructures = readStringList(raw.key_structures ?? raw.keyStructures);
        sentences.push({
          index,
          zh: trim(raw.zh) || trim(raw.chinese),
          note: trim(raw.note),
          key_structures: keyStructures.join(", "),
        });
      });
    }
    paragraph_summaries = readParagraphSummaries(
      mainText.paragraph_summaries ?? mainText.paragraphSummaries
    );
    if (isRecord(mainText.reflection)) {
      reflection_questions = readStringList(
        mainText.reflection.questions_mn ?? mainText.reflection.questionsMn
      );
    }
  }

  return {
    hasJsonSource: true,
    grammarItems,
    sentences,
    paragraph_summaries,
    reflection_questions,
  };
}

function writeOptionalString(
  item: Record<string, unknown>,
  key: string,
  value: string
) {
  const text = value.trim();
  if (text) item[key] = text;
  else delete item[key];
}

function writeMistakes(item: Record<string, unknown>, rows: TeacherMistakeForm[]) {
  const cleaned = rows
    .map((row) => ({
      wrong: row.wrong.trim(),
      right: row.right.trim(),
      why: row.why.trim() || undefined,
    }))
    .filter((row) => row.wrong || row.right);
  if (cleaned.length > 0) item.common_mistakes = cleaned;
  else {
    delete item.common_mistakes;
    delete item.commonMistakes;
  }
}

function writeCheck(item: Record<string, unknown>, check: TeacherCheckForm) {
  const question = check.question.trim();
  const answer = check.answer.trim();
  const options = check.options.map((o) => o.trim()).filter(Boolean);
  if (question && options.length > 0 && answer) {
    item.check = { question, options, answer };
  } else {
    delete item.check;
  }
}

function applyOverlayToItem(
  item: Record<string, unknown>,
  form: Pick<
    TeacherGrammarItemForm,
    "structure" | "teacher_notes" | "common_mistakes" | "check"
  >
) {
  writeOptionalString(item, "structure", form.structure);
  writeOptionalString(item, "teacher_notes", form.teacher_notes);
  writeMistakes(item, form.common_mistakes);
  writeCheck(item, form.check);
}

function syncPackageGrammarOverlay(
  data: Record<string, unknown>,
  grammarItems: TeacherGrammarItemForm[]
) {
  const grammarOnly = grammarItems.filter((item) => item.kind === "grammar");
  for (const pkgKey of ["hskLessonPackage", "lessonPackage", "goldStandardLesson"]) {
    const pkg = data[pkgKey];
    if (!isRecord(pkg) || !Array.isArray(pkg.grammar)) continue;
    for (let i = 0; i < grammarOnly.length && i < pkg.grammar.length; i++) {
      const raw = pkg.grammar[i];
      if (!isRecord(raw)) continue;
      applyOverlayToItem(raw, grammarOnly[i]!);
    }
  }
  const study = isRecord(data.hskStudyContent) ? data.hskStudyContent : null;
  if (study && isRecord(study.lessonTeaching) && Array.isArray(study.lessonTeaching.grammar)) {
    for (let i = 0; i < grammarOnly.length && i < study.lessonTeaching.grammar.length; i++) {
      const raw = study.lessonTeaching.grammar[i];
      if (!isRecord(raw)) continue;
      applyOverlayToItem(raw, grammarOnly[i]!);
    }
  }
}

export function applyTeacherOverlayToSourceNote(
  sourceNote: string | undefined | null,
  state: TeacherOverlayAdminState
): { sourceNote: string | null; error: string | null } {
  const parsed = parseLessonSourceNote(sourceNote);
  if (parsed.format !== "json") {
    return {
      sourceNote: null,
      error: "Энэ хичээл JSON source_note ашигладаггүй — багшийн давхарга засварлах боломжгүй.",
    };
  }

  const data = deepClone(parsed.data);
  const study = ensureStudy(data);
  const texts = ensureTexts(study);

  const grammarArray = normalizeGrammarArray(study.grammar);
  const grammarForms = state.grammarItems.filter((item) => item.kind === "grammar");
  for (let i = 0; i < grammarForms.length; i++) {
    if (!grammarArray[i]) grammarArray[i] = {};
    applyOverlayToItem(grammarArray[i]!, grammarForms[i]!);
  }
  if (grammarArray.length > 0 || grammarForms.length > 0) {
    study.grammar = grammarArray;
  }

  const wordArray = normalizeGrammarArray(
    texts.wordExplanation ?? texts.word_explanation
  );
  const wordForms = state.grammarItems.filter(
    (item) => item.kind === "wordExplanation"
  );
  for (let i = 0; i < wordForms.length; i++) {
    if (!wordArray[i]) wordArray[i] = { point: wordForms[i]!.label };
    applyOverlayToItem(wordArray[i]!, wordForms[i]!);
  }
  if (wordArray.length > 0 || wordForms.length > 0) {
    texts.wordExplanation = wordArray;
    delete texts.word_explanation;
  }

  let mainText = findMainTextRecord(study);
  if (
    !mainText &&
    (state.sentences.length > 0 ||
      state.paragraph_summaries.length > 0 ||
      state.reflection_questions.length > 0)
  ) {
    mainText = { sentences: [] };
    texts.mainText = mainText;
  }

  if (mainText) {
    if (!Array.isArray(mainText.sentences)) {
      mainText.sentences = [];
    }
    const sentenceRows = mainText.sentences as unknown[];
    for (const form of state.sentences) {
      const rawRow = sentenceRows[form.index];
      const existing: Record<string, unknown> = isRecord(rawRow)
        ? { ...rawRow }
        : { zh: form.zh };
      writeOptionalString(existing, "note", form.note);
      const chips = form.key_structures
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (chips.length > 0) existing.key_structures = chips;
      else {
        delete existing.key_structures;
        delete existing.keyStructures;
      }
      sentenceRows[form.index] = existing;
    }
    mainText.sentences = sentenceRows;

    const summaries = state.paragraph_summaries.map((s) => s.trim()).filter(Boolean);
    if (summaries.length > 0) {
      mainText.paragraph_summaries = summaries.map((mn, i) => ({
        paragraph: i + 1,
        mn,
      }));
    } else {
      delete mainText.paragraph_summaries;
      delete mainText.paragraphSummaries;
    }

    const questions = state.reflection_questions.map((s) => s.trim()).filter(Boolean);
    if (questions.length > 0) {
      mainText.reflection = { questions_mn: questions };
    } else {
      delete mainText.reflection;
    }
  }

  syncPackageGrammarOverlay(data, state.grammarItems);

  return {
    sourceNote: JSON.stringify(data),
    error: null,
  };
}

export function grammarItemToJsonBlock(
  item: Pick<
    TeacherGrammarItemForm,
    "structure" | "teacher_notes" | "common_mistakes" | "check"
  >
): TeacherOverlayJsonBlock {
  const block: TeacherOverlayJsonBlock = {};
  if (item.structure.trim()) block.structure = item.structure.trim();
  if (item.teacher_notes.trim()) block.teacher_notes = item.teacher_notes.trim();
  const mistakes = item.common_mistakes
    .map((row) => ({
      wrong: row.wrong.trim(),
      right: row.right.trim(),
      why: row.why.trim() || undefined,
    }))
    .filter((row) => row.wrong || row.right);
  if (mistakes.length > 0) block.common_mistakes = mistakes;
  const question = item.check.question.trim();
  const answer = item.check.answer.trim();
  const options = item.check.options.map((o) => o.trim()).filter(Boolean);
  if (question && options.length > 0 && answer) {
    block.check = { question, options, answer };
  }
  return block;
}

export function parseTeacherOverlayJsonBlock(
  raw: string
): { data: TeacherOverlayJsonBlock | null; error: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { data: {}, error: null };
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!isRecord(parsed)) {
      return { data: null, error: "JSON объект байх ёстой." };
    }
    const block: TeacherOverlayJsonBlock = {};
    if (typeof parsed.structure === "string") block.structure = parsed.structure.trim();
    if (typeof parsed.teacher_notes === "string") {
      block.teacher_notes = parsed.teacher_notes.trim();
    } else if (typeof parsed.teacherNotes === "string") {
      block.teacher_notes = parsed.teacherNotes.trim();
    }
    const mistakesRaw = parsed.common_mistakes ?? parsed.commonMistakes;
    if (mistakesRaw != null) {
      if (!Array.isArray(mistakesRaw)) {
        return { data: null, error: "common_mistakes массив байх ёстой." };
      }
      block.common_mistakes = readMistakes(mistakesRaw);
    }
    if (parsed.check != null) {
      if (!isRecord(parsed.check)) {
        return { data: null, error: "check объект байх ёстой." };
      }
      const check = readCheck(parsed.check);
      if (check.question && check.options.length > 0 && check.answer) {
        block.check = check;
      }
    }
    return { data: block, error: null };
  } catch {
    return { data: null, error: "JSON буруу байна — синтакс шалгана уу." };
  }
}

export function applyJsonBlockToGrammarItem(
  item: TeacherGrammarItemForm,
  block: TeacherOverlayJsonBlock
): TeacherGrammarItemForm {
  return {
    ...item,
    structure: block.structure ?? "",
    teacher_notes: block.teacher_notes ?? "",
    common_mistakes: (block.common_mistakes ?? []).map((row) => ({
      wrong: row.wrong,
      right: row.right,
      why: row.why ?? "",
    })),
    check: block.check
      ? {
          question: block.check.question,
          options: block.check.options,
          answer: block.check.answer,
        }
      : { question: "", options: [], answer: "" },
  };
}
