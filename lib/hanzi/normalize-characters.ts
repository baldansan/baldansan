import type { HskCharacter, HskLessonPackage } from "@/types/hsk-lesson-package";

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
  };
}
