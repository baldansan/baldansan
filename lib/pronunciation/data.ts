import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parsePinyinSyllables } from "@/lib/speech/pinyin-tones";
import { stripToneMark } from "./pinyin-mark";
import type { PinyinChart } from "./minimal-pairs";

/**
 * «Дуудлага / 发音» — public/data/pinyin_chart.json, public/data/tone_pairs.json,
 * data/hsk_words.json-г сервер талд fs-ээр уншина (next.config outputFileTracingIncludes).
 * Нэг процесст нэг л удаа уншина.
 */

const cache = new Map<string, Promise<unknown>>();

/**
 * АНХААР: файлын замыг `path.join(process.cwd(), "literal", ...)` хэлбэрээр
 * ШУУД бичнэ. Хувьсагчаар (`path.join(cwd, rel)`) өгвөл Vercel-ийн file tracer
 * бүх repo-г (375 MB) серверийн функцэд багцалж, cold start 30с+ болдог байсан.
 */
function readJsonAt<T>(key: string, absPath: string): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fs.readFile(absPath, "utf8").then((s) => JSON.parse(s) as T);
    cache.set(key, p);
  }
  return p;
}

export type TonePairWord = { zh: string; pinyin: string; mn: string; level: number };
export type TonePairs = Record<string, TonePairWord[]>;

type HskWord = { simplified: string; pinyin: string; hsk_level: string };

export function getPinyinChart(): Promise<PinyinChart> {
  return readJsonAt<PinyinChart>(
    "pinyin_chart",
    path.join(process.cwd(), "public", "data", "pinyin_chart.json")
  );
}

export function getTonePairs(): Promise<TonePairs> {
  return readJsonAt<TonePairs>(
    "tone_pairs",
    path.join(process.cwd(), "public", "data", "tone_pairs.json")
  );
}

export type ToneGameItem = { syllable: string; tone: number; file: string };

/**
 * «Аялгуу таних» тоглоомын үеүд: самбар ∩ HSK 1–2 үгсийн үеүд, 1–4-р аялгаар.
 */
export async function getCommonSyllableItems(): Promise<ToneGameItem[]> {
  const [chart, words] = await Promise.all([getPinyinChart(), readJsonAt<HskWord[]>(
      "hsk_words",
      path.join(process.cwd(), "data", "hsk_words.json")
    )]);
  const bases = new Set<string>();
  for (const w of words) {
    if (w.hsk_level !== "1" && w.hsk_level !== "2") continue;
    for (const s of parsePinyinSyllables(w.pinyin ?? "")) {
      const base = stripToneMark(s.syllable);
      if (chart.cells[base]) bases.add(base);
    }
  }
  const items: ToneGameItem[] = [];
  for (const base of [...bases].sort()) {
    const cell = chart.cells[base];
    for (const tone of [1, 2, 3, 4]) {
      const file = cell.tones[String(tone)];
      if (file) items.push({ syllable: base, tone, file });
    }
  }
  return items;
}
