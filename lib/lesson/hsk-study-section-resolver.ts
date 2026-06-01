import {
  HSK_CHARACTER_ALIASES,
  HSK_DIALOGUE_ALIASES,
  HSK_OBJECTIVE_ALIASES,
  HSK_PINYIN_ALIASES,
  HSK_SENTENCE_ALIASES,
  HSK_STUDY_GUIDE_ALIASES,
  HSK_TEACHER_NOTE_ALIASES,
  HSK_TONE_ALIASES,
  hskRecordKeyMatches,
  hskSectionKeyMatches,
} from "@/lib/lesson/hsk-study-section-aliases";

export type HskResolvedSection<T> = {
  value: T;
  source: string;
  count: number;
};

export type HskStudySectionDebugMap = {
  objectives: HskResolvedSection<string[]>;
  pinyin: HskResolvedSection<string[]>;
  tones: HskResolvedSection<unknown[]>;
  dialogues: HskResolvedSection<unknown[]>;
  sentenceExplanations: HskResolvedSection<string[]>;
  characterNotes: HskResolvedSection<unknown[]>;
  studyGuideSteps: HskResolvedSection<string[]>;
  teacherNotes: HskResolvedSection<string[]>;
};

export type HskStudyPayloadPool = {
  studyContent: unknown;
  lessonPayload: unknown;
  notesPayload: unknown;
  grammarPayload: unknown;
  workbookPayload: unknown;
  textsPayload: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function pickText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!isRecord(value)) return "";
  return (
    trim(value.mongolian) ||
    trim(value.mn) ||
    trim(value.titleMn) ||
    trim(value.teacherSpeechMn) ||
    trim(value.practiceMn) ||
    trim(value.bodyMn) ||
    trim(value.speechMn) ||
    trim(value.textMn) ||
    trim(value.text) ||
    trim(value.description) ||
    trim(value.content) ||
    trim(value.summary) ||
    trim(value.body) ||
    ""
  );
}

export function collectHskTextBlocks(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) out.push(text);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectHskTextBlocks(item, out);
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
      "content",
      "intro",
      "body",
      "entries",
    ]) {
      if (key in value) collectHskTextBlocks(value[key], out);
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

function sectionLabels(section: Record<string, unknown>): string[] {
  return [
    section.id,
    section.key,
    section.type,
    section.sectionKey,
    section.sectionId,
    section.slug,
    section.title,
    section.name,
    section.label,
  ]
    .map(trim)
    .filter(Boolean);
}

function findStudySectionsByAlias(
  studySections: unknown,
  aliases: readonly string[]
): Record<string, unknown>[] {
  if (!Array.isArray(studySections)) return [];
  return studySections.filter((item): item is Record<string, unknown> => {
    if (!isRecord(item)) return false;
    return sectionLabels(item).some((label) => hskSectionKeyMatches(label, aliases));
  });
}

function findNestedSectionByAlias(
  sections: unknown,
  aliases: readonly string[]
): unknown[] {
  if (!isRecord(sections)) return [];
  const matches: unknown[] = [];
  for (const [key, value] of Object.entries(sections)) {
    if (hskRecordKeyMatches(key, aliases) && value != null) {
      matches.push(value);
    }
  }
  return matches;
}

function findTopLevelByAlias(
  record: unknown,
  aliases: readonly string[]
): unknown[] {
  if (!isRecord(record)) return [];
  const matches: unknown[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (hskRecordKeyMatches(key, aliases) && value != null) {
      matches.push(value);
    }
  }
  return matches;
}

function studySectionsFrom(pool: HskStudyPayloadPool): unknown {
  if (isRecord(pool.studyContent) && pool.studyContent.studySections) {
    return pool.studyContent.studySections;
  }
  if (isRecord(pool.lessonPayload) && pool.lessonPayload.studySections) {
    return pool.lessonPayload.studySections;
  }
  return null;
}

function nestedSectionsFrom(pool: HskStudyPayloadPool): unknown {
  if (isRecord(pool.studyContent) && pool.studyContent.sections) {
    return pool.studyContent.sections;
  }
  if (isRecord(pool.lessonPayload) && pool.lessonPayload.sections) {
    return pool.lessonPayload.sections;
  }
  return null;
}

export function resolveHskTextSection(
  pool: HskStudyPayloadPool,
  aliases: readonly string[],
  sectionName: string
): HskResolvedSection<string[]> {
  const candidates: { source: string; texts: string[] }[] = [];

  const pushTexts = (source: string, value: unknown) => {
    const texts = uniqueStrings(collectHskTextBlocks(value));
    if (texts.length) candidates.push({ source, texts });
  };

  for (const value of findTopLevelByAlias(pool.studyContent, aliases)) {
    pushTexts(`hskStudyContent.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.lessonPayload, aliases)) {
    pushTexts(`hskLesson.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.notesPayload, aliases)) {
    pushTexts(`hskNotes.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.grammarPayload, aliases)) {
    pushTexts(`hskGrammar.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.workbookPayload, aliases)) {
    pushTexts(`hskWorkbook.${sectionName}`, value);
  }

  for (const value of findNestedSectionByAlias(nestedSectionsFrom(pool), aliases)) {
    pushTexts(`sections.${sectionName}`, value);
  }

  for (const section of findStudySectionsByAlias(studySectionsFrom(pool), aliases)) {
    const label = sectionLabels(section)[0] ?? sectionName;
    pushTexts(`studySections.${label}`, section);
  }

  if (candidates.length === 0) {
    return { value: [], source: "none", count: 0 };
  }

  const merged = uniqueStrings(candidates.flatMap((item) => item.texts));
  return {
    value: merged,
    source: candidates.map((item) => item.source).join(", "),
    count: merged.length,
  };
}

export function resolveHskRawSection(
  pool: HskStudyPayloadPool,
  aliases: readonly string[],
  sectionName: string
): HskResolvedSection<unknown[]> {
  const rawItems: unknown[] = [];
  const sources: string[] = [];

  const pushRaw = (source: string, value: unknown) => {
    if (value == null) return;
    sources.push(source);
    if (Array.isArray(value)) {
      rawItems.push(...value);
      return;
    }
    rawItems.push(value);
  };

  for (const value of findTopLevelByAlias(pool.studyContent, aliases)) {
    pushRaw(`hskStudyContent.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.lessonPayload, aliases)) {
    pushRaw(`hskLesson.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.notesPayload, aliases)) {
    pushRaw(`hskNotes.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.grammarPayload, aliases)) {
    pushRaw(`hskGrammar.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.workbookPayload, aliases)) {
    pushRaw(`hskWorkbook.${sectionName}`, value);
  }
  for (const value of findTopLevelByAlias(pool.textsPayload, aliases)) {
    pushRaw(`hskTexts.${sectionName}`, value);
  }

  for (const value of findNestedSectionByAlias(nestedSectionsFrom(pool), aliases)) {
    pushRaw(`sections.${sectionName}`, value);
  }

  for (const section of findStudySectionsByAlias(studySectionsFrom(pool), aliases)) {
    const label = sectionLabels(section)[0] ?? sectionName;
    pushRaw(`studySections.${label}`, section);
    if (Array.isArray(section.items)) pushRaw(`studySections.${label}.items`, section.items);
    if (Array.isArray(section.tones)) pushRaw(`studySections.${label}.tones`, section.tones);
    if (Array.isArray(section.lines)) pushRaw(`studySections.${label}.lines`, section.lines);
  }

  return {
    value: rawItems,
    source: sources.length ? sources.join(", ") : "none",
    count: rawItems.length,
  };
}

export function resolveHskObjectives(
  pool: HskStudyPayloadPool
): HskResolvedSection<string[]> {
  const fromAlias = resolveHskTextSection(pool, HSK_OBJECTIVE_ALIASES, "objectives");
  if (fromAlias.count > 0) return fromAlias;

  const legacy: string[] = [];
  if (isRecord(pool.lessonPayload)) {
    collectHskTextBlocks(pool.lessonPayload.lessonIntro, legacy);
    collectHskTextBlocks(pool.lessonPayload.objectives, legacy);
  }
  const merged = uniqueStrings(legacy);
  return {
    value: merged,
    source: merged.length ? "hskLesson.lessonIntro/objectives" : "none",
    count: merged.length,
  };
}

export function resolveHskPinyinSection(
  pool: HskStudyPayloadPool
): HskResolvedSection<string[]> {
  const primary = resolveHskTextSection(pool, HSK_PINYIN_ALIASES, "pinyin");
  const legacy: string[] = [];

  if (isRecord(pool.lessonPayload)) {
    collectHskTextBlocks(pool.lessonPayload.pinyinPronunciation, legacy);
    collectHskTextBlocks(pool.lessonPayload.pronunciationNotes, legacy);
  }
  if (isRecord(pool.textsPayload)) {
    collectHskTextBlocks(pool.textsPayload.pinyinPronunciation, legacy);
  }

  const merged = uniqueStrings([...primary.value, ...legacy]);
  if (merged.length === 0) {
    return { value: [], source: "none", count: 0 };
  }

  const sources = [
    primary.count > 0 ? primary.source : "",
    legacy.length ? "hskLesson.pinyinPronunciation" : "",
  ].filter(Boolean);

  return {
    value: merged,
    source: sources.join(", ") || "hskLesson.pinyinPronunciation",
    count: merged.length,
  };
}

export function resolveHskToneRaw(
  pool: HskStudyPayloadPool
): HskResolvedSection<unknown[]> {
  const fromAlias = resolveHskRawSection(pool, HSK_TONE_ALIASES, "tones");
  if (fromAlias.count > 0) return fromAlias;

  if (isRecord(pool.lessonPayload) && pool.lessonPayload.tones != null) {
    const value = Array.isArray(pool.lessonPayload.tones)
      ? pool.lessonPayload.tones
      : [pool.lessonPayload.tones];
    return { value, source: "hskLesson.tones", count: value.length };
  }

  return { value: [], source: "none", count: 0 };
}

export function resolveHskTeacherNotes(
  pool: HskStudyPayloadPool
): HskResolvedSection<string[]> {
  const fromAlias = resolveHskTextSection(
    pool,
    HSK_TEACHER_NOTE_ALIASES,
    "teacherNotes"
  );
  const legacy: string[] = [];

  if (isRecord(pool.notesPayload)) {
    collectHskTextBlocks(pool.notesPayload.teacherNotes, legacy);
    collectHskTextBlocks(pool.notesPayload.teachersBook, legacy);
    collectHskTextBlocks(pool.notesPayload.notes, legacy);
  }
  if (isRecord(pool.lessonPayload)) {
    collectHskTextBlocks(pool.lessonPayload.teacherNotes, legacy);
  }

  const merged = uniqueStrings([...fromAlias.value, ...legacy]);
  return {
    value: merged,
    source:
      fromAlias.count > 0
        ? fromAlias.source
        : legacy.length
          ? "hskNotes.teacherNotes"
          : "none",
    count: merged.length,
  };
}
