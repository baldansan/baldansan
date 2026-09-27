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

async function readJson<T>(rel: string): Promise<T> {
  let p = cache.get(rel) as Promise<T> | undefined;
  if (!p) {
    p = fs.readFile(path.join(process.cwd(), rel), "utf8").then((s) => JSON.parse(s) as T);
    cache.set(rel, p);
  }
  return p;
}

export type TonePairWord = { zh: string; pinyin: string; mn: string; level: number };
export type TonePairs = Record<string, TonePairWord[]>;

type HskWord = { simplified: string; pinyin: string; hsk_level: string };

export function getPinyinChart(): Promise<PinyinChart> {
  return readJson<PinyinChart>("public/data/pinyin_chart.json");
}

export function getTonePairs(): Promise<TonePairs> {
  return readJson<TonePairs>("public/data/tone_pairs.json");
}

export type ToneGameItem = { syllable: string; tone: number; file: string };

/**
 * «Аялгуу таних» тоглоомын үеүд: самбар ∩ HSK 1–2 үгсийн үеүд, 1–4-р аялгаар.
 */
export async function getCommonSyllableItems(): Promise<ToneGameItem[]> {
  const [chart, words] = await Promise.all([getPinyinChart(), readJson<HskWord[]>("data/hsk_words.json")]);
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
