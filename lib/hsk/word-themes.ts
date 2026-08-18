import { readFile } from "fs/promises";
import path from "path";
import type { HskLevel } from "@/lib/hsk";

/**
 * Цээжлэх үгсийн сэдэвчилсэн бүлгүүд.
 * Эх файл: public/data/hsk_word_themes.json
 * Бүтэц: { "<түвшин>": [{ id, icon, title, words: string[] }, ...], ... }
 */
export type WordThemeGroup = {
  id: string;
  icon: string;
  title: string;
  words: string[];
};

type WordThemesFile = Record<string, WordThemeGroup[]>;

let themesCache: WordThemesFile | null = null;
let loadPromise: Promise<WordThemesFile | null> | null = null;

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

/** Тухайн түвшний сэдэвчилсэн бүлгүүд (байхгүй бол null → пиньинь fallback). */
export async function getWordThemeGroups(
  level: HskLevel
): Promise<WordThemeGroup[] | null> {
  const data = await loadThemesFile();
  const groups = data?.[level];
  if (!groups || groups.length === 0) return null;
  return groups;
}

/** Нэг бүлгийг id-гаар нь олох. */
export async function getWordThemeGroup(
  level: HskLevel,
  groupId: string
): Promise<WordThemeGroup | null> {
  const groups = await getWordThemeGroups(level);
  return groups?.find((g) => g.id === groupId) ?? null;
}
