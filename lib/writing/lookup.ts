/**
 * Ханз таних (сервер тал): текст → дэвтрийн ханзнууд, пиньинь, утгатай нь.
 * Эх: data/hsk_words.json (10,896 үг) + public/data/hsk_char_gloss.json (3,088 ханз).
 * fs-ээр уншиж, процессын санах ойд нэг удаа хадгална.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WritingItem } from "@/lib/writing/types";

type HskWordRow = {
  simplified: string;
  pinyin: string;
  meaning_mn?: string | null;
  hsk_level?: string | null;
};

type WordEntry = { pinyin: string; meaning_mn: string | null; level: string | null };
type CharGloss = { p: string; mn: string };

type Dict = {
  words: Map<string, WordEntry>;
  gloss: Record<string, CharGloss>;
  maxWordLen: number;
};

let dictPromise: Promise<Dict> | null = null;

async function loadDict(): Promise<Dict> {
  if (!dictPromise) {
    dictPromise = (async () => {
      const [wordsRaw, glossRaw] = await Promise.all([
        readFile(path.join(process.cwd(), "data", "hsk_words.json"), "utf8"),
        readFile(path.join(process.cwd(), "public", "data", "hsk_char_gloss.json"), "utf8"),
      ]);
      const rows = JSON.parse(wordsRaw) as HskWordRow[];
      const words = new Map<string, WordEntry>();
      let maxWordLen = 1;
      for (const row of rows) {
        const key = (row.simplified ?? "").trim();
        if (!key || words.has(key)) continue;
        words.set(key, {
          pinyin: (row.pinyin ?? "").trim(),
          meaning_mn: row.meaning_mn?.trim() || null,
          level: row.hsk_level ?? null,
        });
        const len = Array.from(key).length;
        if (len > maxWordLen) maxWordLen = len;
      }
      const gloss = JSON.parse(glossRaw) as Record<string, CharGloss>;
      return { words, gloss, maxWordLen: Math.min(maxWordLen, 4) };
    })().catch((err) => {
      dictPromise = null;
      throw err;
    });
  }
  return dictPromise;
}

const HAN_RUN = /\p{Script=Han}+/gu;

/** Үгийн пиньиньийг үе үеэр (ханз бүрд нэг) хуваана; тоо таарахгүй бол null. */
function syllablesFor(pinyin: string, charCount: number): string[] | null {
  const parts = pinyin.split(/\s+/).filter(Boolean);
  return parts.length === charCount ? parts : null;
}

/**
 * Нэг ханзны бүлгийг (үг эсвэл өгүүлбэрийн хэсэг) үгэнд хуваана:
 * бүхэлдээ үг бол шууд, үгүй бол зүүнээс баруун тийш хамгийн урт үгээр (max 4).
 */
function segment(run: string[], dict: Dict): { chars: string[]; word: string | null }[] {
  const whole = run.join("");
  if (run.length > 1 && dict.words.has(whole)) {
    return [{ chars: run, word: whole }];
  }
  const out: { chars: string[]; word: string | null }[] = [];
  let i = 0;
  while (i < run.length) {
    let matched: string[] | null = null;
    for (let len = Math.min(dict.maxWordLen, run.length - i); len >= 2; len -= 1) {
      const candidate = run.slice(i, i + len);
      if (dict.words.has(candidate.join(""))) {
        matched = candidate;
        break;
      }
    }
    if (matched) {
      out.push({ chars: matched, word: matched.join("") });
      i += matched.length;
    } else {
      out.push({ chars: [run[i]!], word: null });
      i += 1;
    }
  }
  return out;
}

export type LookupResult = { items: WritingItem[]; unknown: string[] };

/** Текстээс ханз бүрийг (давхардалгүй, анхны дарааллаар) таньж буцаана. */
export async function lookupWritingText(text: string): Promise<LookupResult> {
  const dict = await loadDict();
  const items: WritingItem[] = [];
  const seen = new Set<string>();
  const unknown: string[] = [];

  for (const match of text.matchAll(HAN_RUN)) {
    const run = Array.from(match[0]);
    for (const seg of segment(run, dict)) {
      const wordEntry = seg.word ? dict.words.get(seg.word) ?? null : null;
      const syllables =
        seg.word && wordEntry ? syllablesFor(wordEntry.pinyin, seg.chars.length) : null;
      seg.chars.forEach((ch, idx) => {
        if (seen.has(ch)) return;
        seen.add(ch);
        const gloss = dict.gloss[ch];
        const single = dict.words.get(ch);
        const pinyin =
          (syllables ? syllables[idx] : null) ??
          gloss?.p ??
          (single?.pinyin || null);
        const meaning =
          (seg.word ? wordEntry?.meaning_mn ?? null : null) ??
          gloss?.mn ??
          single?.meaning_mn ??
          null;
        if (!pinyin && !meaning) unknown.push(ch);
        items.push({
          ch,
          word: seg.word,
          pinyin: pinyin || null,
          meaning_mn: meaning || null,
        });
      });
    }
  }

  return { items, unknown };
}
