import type {
  HskCharacter,
  HskCharacterConfusable,
  HskCharacterWordGameItem,
  HskCharactersIntro,
  HskLessonPackage,
} from "@/types/hsk-lesson-package";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trim(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizePractice(value: unknown): HskCharacter["practice"] {
  const raw = trim(value).toLowerCase();
  return raw === "write" ? "write" : "recognize";
}

function normalizeComponents(
  raw: unknown
): HskCharacter["components"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter(isRecord)
    .map((row) => {
      const c = trim(row.c) || trim(row.hanzi) || trim(row.zh);
      if (!c) return null;
      return {
        c,
        meaning_en: trim(row.meaning_en) || trim(row.meaningEn) || undefined,
        meaning_mn: trim(row.meaning_mn) || trim(row.meaningMn) || undefined,
        icon: trim(row.icon) || undefined,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
  return items.length > 0 ? items : undefined;
}

function normalizePinyin(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => trim(item)).filter(Boolean);
  }
  const single = trim(raw);
  return single ? [single] : [];
}

export function normalizeHskCharacter(raw: unknown): HskCharacter | null {
  if (!isRecord(raw)) return null;

  const hanzi = trim(raw.hanzi) || trim(raw.zh) || trim(raw.chinese);
  if (!hanzi) return null;

  const pinyin = normalizePinyin(raw.pinyin);
  const strokeCount =
    typeof raw.strokeCount === "number"
      ? raw.strokeCount
      : typeof raw.strokes === "number"
        ? raw.strokes
        : undefined;

  return {
    hanzi,
    pinyin,
    strokeCount,
    radical: trim(raw.radical) || undefined,
    components: normalizeComponents(raw.components),
    readingLevel:
      typeof raw.readingLevel === "number" ? raw.readingLevel : undefined,
    writingLevel:
      typeof raw.writingLevel === "number" ? raw.writingLevel : undefined,
    practice: normalizePractice(raw.practice),
    frequency: typeof raw.frequency === "number" ? raw.frequency : undefined,
    exampleWords: Array.isArray(raw.exampleWords)
      ? raw.exampleWords.map((w) => trim(w)).filter(Boolean)
      : undefined,
    meaningEn: trim(raw.meaningEn) || trim(raw.meaning_en) || undefined,
    meaningMn: trim(raw.meaningMn) || trim(raw.meaning_mn) || undefined,
    etymology_mn:
      trim(raw.etymology_mn) || trim(raw.etymologyMn) || undefined,
    etymologyMn:
      trim(raw.etymologyMn) || trim(raw.etymology_mn) || undefined,
  };
}

function normalizeIntro(raw: unknown): HskCharactersIntro | undefined {
  if (!isRecord(raw)) return undefined;
  const intro: HskCharactersIntro = {
    title_zh: trim(raw.title_zh) || trim(raw.titleZh) || undefined,
    title_mn: trim(raw.title_mn) || trim(raw.titleMn) || undefined,
    teacher_mn: trim(raw.teacher_mn) || trim(raw.teacherMn) || undefined,
  };
  return intro.title_zh || intro.title_mn || intro.teacher_mn ? intro : undefined;
}

function normalizeWordGame(raw: unknown): HskCharacterWordGameItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter(isRecord)
    .map((row): HskCharacterWordGameItem | null => {
      const parts = Array.isArray(row.parts)
        ? row.parts.map((p) => trim(p)).filter(Boolean)
        : [];
      const result = trim(row.result);
      if (parts.length === 0 || !result) return null;
      return {
        parts,
        result,
        pinyin: trim(row.pinyin) || undefined,
        mn: trim(row.mn) || undefined,
        hint_mn: trim(row.hint_mn) || trim(row.hintMn) || undefined,
      };
    })
    .filter((row): row is HskCharacterWordGameItem => row !== null);
  return items.length > 0 ? items : undefined;
}

function normalizeConfusables(raw: unknown): HskCharacterConfusable[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter(isRecord)
    .map((row): HskCharacterConfusable | null => {
      const a = trim(row.a);
      const b = trim(row.b);
      const word_a = trim(row.word_a) || trim(row.wordA);
      const word_b = trim(row.word_b) || trim(row.wordB);
      if (!a || !b || !word_a || !word_b) return null;
      return {
        a,
        b,
        word_a,
        word_b,
        mn: trim(row.mn) || undefined,
        tip_mn: trim(row.tip_mn) || trim(row.tipMn) || undefined,
      };
    })
    .filter((row): row is HskCharacterConfusable => row !== null);
  return items.length > 0 ? items : undefined;
}

/** intro / wordGame / confusables — characters.json (эсвэл lesson.charactersExtras) -оос. */
export function normalizeCharactersExtras(
  raw: unknown
): Pick<
  NonNullable<HskLessonPackage["characters"]>,
  "intro" | "wordGame" | "confusables"
> {
  if (!isRecord(raw)) return {};
  return {
    intro: normalizeIntro(raw.intro),
    wordGame: normalizeWordGame(raw.wordGame ?? raw.word_game),
    confusables: normalizeConfusables(raw.confusables),
  };
}

export function normalizeCharactersPayload(
  raw: unknown
): HskLessonPackage["characters"] | undefined {
  if (raw == null) return undefined;

  let rows: unknown[] = [];
  if (Array.isArray(raw)) {
    rows = raw;
  } else if (isRecord(raw) && Array.isArray(raw.characters)) {
    rows = raw.characters;
  } else if (isRecord(raw) && Array.isArray(raw.items)) {
    rows = raw.items;
  } else if (isRecord(raw) && trim(raw.hanzi || raw.zh || raw.chinese)) {
    rows = [raw];
  }

  const characters = rows
    .map(normalizeHskCharacter)
    .filter((row): row is HskCharacter => row !== null);

  if (characters.length === 0) return undefined;

  return {
    count: characters.length,
    writeCount: characters.filter((c) => c.practice === "write").length,
    characters,
    ...stripUndefined(normalizeCharactersExtras(raw)),
  };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
