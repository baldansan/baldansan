import { readFile } from "fs/promises";
import path from "path";
import type { HskLevel } from "@/lib/hsk";

/**
 * Цээжлэх үгсийн сэдэвчилсэн бүлгүүд.
 * Эх файл: public/data/hsk_word_themes.json
 * Бүтэц: { "<түвшин>": [{ id, icon, title, words: string[] }, ...], ... }
 *
 * Ханзны гэр бүл (字族) бүлгүүд: public/data/hsk_char_families.json
 * Бүтэц: { "<түвшин>": [{ char, p, mn, words: string[], known: string[] }, ...] }
 * → `fam-<char>-<part>` id-тай WordThemeGroup болгон хувиргана (≤12 үг/хэсэг).
 */
export type WordThemeGroup = {
  id: string;
  icon: string;
  title: string;
  words: string[];
  /** Бүлгийн төрөл (байхгүй бол "theme"). */
  kind?: "theme" | "family";
  /** Ханзны гэр бүл: ханз, пиньинь, богино утга. */
  char?: string;
  charPinyin?: string;
  charMn?: string;
  /** Доод түвшний мэдэх үгс (зөвхөн 1-р хэсэгт). */
  known?: string[];
};

type WordThemesFile = Record<string, WordThemeGroup[]>;

type CharFamily = {
  char: string;
  p: string;
  mn: string;
  words: string[];
  known: string[];
};

type CharFamiliesFile = Record<string, CharFamily[]>;

/** Нэг гэр бүлийн хэсэг дэх дээд үгийн тоо. */
const FAMILY_PART_SIZE = 12;

let themesCache: WordThemesFile | null = null;
let loadPromise: Promise<WordThemesFile | null> | null = null;

let familiesCache: CharFamiliesFile | null = null;
let familiesPromise: Promise<CharFamiliesFile | null> | null = null;

async function loadThemesFile(): Promise<WordThemesFile | null> {
  if (themesCache) return themesCache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const file = path.join(
        process.cwd(),
        "public",
        "data",
        "hsk_word_themes.json"
      );
      const raw = await readFile(file, "utf8");
      const parsed = JSON.parse(raw) as WordThemesFile;
      themesCache = parsed;
      return parsed;
    } catch {
      return null;
    }
  })();

  return loadPromise;
}

async function loadFamiliesFile(): Promise<CharFamiliesFile | null> {
  if (familiesCache) return familiesCache;
  if (familiesPromise) return familiesPromise;

  familiesPromise = (async () => {
    try {
      const file = path.join(
        process.cwd(),
        "public",
        "data",
        "hsk_char_families.json"
      );
      const raw = await readFile(file, "utf8");
      const parsed = JSON.parse(raw) as CharFamiliesFile;
      familiesCache = parsed;
      return parsed;
    } catch {
      return null;
    }
  })();

  return familiesPromise;
}

/** Тухайн түвшний сэдэвчилсэн бүлгүүд (байхгүй бол null → пиньинь fallback). */
export async function getWordThemeGroups(
  level: HskLevel
): Promise<WordThemeGroup[] | null> {
  const data = await loadThemesFile();
  const groups = data?.[level];
  if (!groups || groups.length === 0) return null;
  return groups;
}

/** Тухайн түвшний ханзны гэр бүлүүд — ≤12 үгтэй хэсгүүдэд хуваасан
 * WordThemeGroup[] (байхгүй бол null). */
export async function getCharFamilyGroups(
  level: HskLevel
): Promise<WordThemeGroup[] | null> {
  const data = await loadFamiliesFile();
  const families = data?.[level];
  if (!families || families.length === 0) return null;

  const groups: WordThemeGroup[] = [];
  for (const fam of families) {
    if (!fam?.char || !Array.isArray(fam.words) || fam.words.length === 0) {
      continue;
    }
    const partCount = Math.ceil(fam.words.length / FAMILY_PART_SIZE);
    const baseTitle = `${fam.char} ${fam.p} · ${fam.mn}`;
    for (let part = 1; part <= partCount; part += 1) {
      const chunk = fam.words.slice(
        (part - 1) * FAMILY_PART_SIZE,
        part * FAMILY_PART_SIZE
      );
      const group: WordThemeGroup = {
        id: `fam-${fam.char}-${part}`,
        icon: "🧬",
        title: partCount > 1 ? `${baseTitle} ${part}` : baseTitle,
        words: chunk,
        kind: "family",
        char: fam.char,
        charPinyin: fam.p,
        charMn: fam.mn,
      };
      if (part === 1 && Array.isArray(fam.known) && fam.known.length > 0) {
        group.known = fam.known;
      }
      groups.push(group);
    }
  }

  return groups.length > 0 ? groups : null;
}

/** Нэг бүлгийг id-гаар нь олох (сэдэв эсвэл `fam-` ханзны гэр бүл). */
export async function getWordThemeGroup(
  level: HskLevel,
  groupId: string
): Promise<WordThemeGroup | null> {
  if (groupId.startsWith("fam-")) {
    const families = await getCharFamilyGroups(level);
    return families?.find((g) => g.id === groupId) ?? null;
  }
  const groups = await getWordThemeGroups(level);
  return groups?.find((g) => g.id === groupId) ?? null;
}
