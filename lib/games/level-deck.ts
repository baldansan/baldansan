/**
 * «Үе давах» — үеийн үгийн багц бүрдүүлэгч (сервер тал, fs).
 * data/hsk_words.json-г нэг удаа уншиж, түвшин бүрээр frequency-ээр эрэмбэлнэ.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BOSS_QUESTIONS,
  WINDOW_SIZE,
  levelMeta,
  levelSeed,
  seededShuffle,
  type LevelGame,
  type LevelHskBand,
} from "@/lib/games/level-core";
import type { GameVocabItem } from "@/lib/games/game-types";

type HskWordRow = {
  simplified: string;
  pinyin: string;
  frequency?: number | null;
  hsk_level?: string | null;
  meaning_mn?: string | null;
  example_zh?: string | null;
  example_mn?: string | null;
};

let wordsPromise: Promise<Map<LevelHskBand, GameVocabItem[]>> | null = null;

function toItem(row: HskWordRow): GameVocabItem {
  return {
    id: row.simplified,
    chinese: row.simplified,
    pinyin: (row.pinyin ?? "").trim(),
    mongolian: (row.meaning_mn ?? "").trim(),
    hskLevel: `HSK${row.hsk_level ?? ""}`,
    exampleChinese: (row.example_zh ?? "").trim(),
    exampleMongolian: (row.example_mn ?? "").trim(),
  };
}

/** Түвшин бүрийн үгс, frequency-ээр эрэмбэлсэн (null сүүлд), давхардалгүй. */
export async function loadWordsByBand(): Promise<Map<LevelHskBand, GameVocabItem[]>> {
  if (!wordsPromise) {
    wordsPromise = (async () => {
      const raw = await readFile(path.join(process.cwd(), "data", "hsk_words.json"), "utf8");
      const rows = JSON.parse(raw) as HskWordRow[];
      const byBand = new Map<LevelHskBand, { row: HskWordRow; order: number }[]>();
      rows.forEach((row, order) => {
        const band = row.hsk_level as LevelHskBand | null | undefined;
        if (!band || !row.simplified || !row.meaning_mn) return;
        if (!byBand.has(band)) byBand.set(band, []);
        byBand.get(band)!.push({ row, order });
      });
      const result = new Map<LevelHskBand, GameVocabItem[]>();
      for (const [band, list] of byBand) {
        list.sort((a, b) => {
          const fa = a.row.frequency ?? Number.POSITIVE_INFINITY;
          const fb = b.row.frequency ?? Number.POSITIVE_INFINITY;
          if (fa !== fb) return fa - fb;
          return a.order - b.order;
        });
        const seen = new Set<string>();
        const items: GameVocabItem[] = [];
        for (const { row } of list) {
          if (seen.has(row.simplified)) continue;
          seen.add(row.simplified);
          items.push(toItem(row));
        }
        result.set(band, items);
      }
      return result;
    })().catch((err) => {
      wordsPromise = null;
      throw err;
    });
  }
  return wordsPromise;
}

/** arrange/missing-word: жишээ өгүүлбэр ≥ 4 тэмдэгт, дотроо үгээ агуулсан байх. */
function needsExample(game: LevelGame): boolean {
  return game === "arrange" || game === "missing-word";
}

function usableForGame(items: GameVocabItem[], game: LevelGame): GameVocabItem[] {
  if (!needsExample(game)) return items.filter((w) => w.chinese && w.mongolian);
  return items.filter(
    (w) =>
      w.chinese &&
      w.mongolian &&
      w.exampleChinese &&
      w.exampleChinese.replace(/\s/g, "").length >= 4 &&
      w.exampleChinese.includes(w.chinese)
  );
}

export function buildLevelDeck(
  bandWords: GameVocabItem[],
  game: LevelGame,
  level: number
): GameVocabItem[] {
  const meta = levelMeta(level);
  const usable = usableForGame(bandWords, game);
  const size = WINDOW_SIZE[game];
  const seed = levelSeed(game, meta.level);

  if (meta.isBoss) {
    // Өнөөг хүртэлх бүх цонх (энэ түвшинд) → 8 үг.
    const poolEnd = Math.min(usable.length, Math.max(size, meta.windowIndex * size));
    const pool = usable.slice(0, poolEnd);
    return seededShuffle(pool, seed).slice(0, BOSS_QUESTIONS);
  }

  let start = meta.windowIndex * size;
  if (start + size > usable.length) {
    // Түвшний үг цонхонд хүрэлцэхгүй бол сүүлийн бүтэн цонхыг авна.
    start = Math.max(0, usable.length - size);
  }
  const window = usable.slice(start, start + size);
  return seededShuffle(window, seed);
}
