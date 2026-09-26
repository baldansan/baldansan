import {
  getCharBreakdownView,
  hasCharBreakdown,
  resolveBreakdownCharsForText,
  type CharBreakdownView,
} from "@/lib/hanzi/char-breakdown-data";

export type DecompositionSubPart = {
  c: string;
  name: string;
  nameZh?: string;
  icon: string;
};

export type DecompositionComponent = {
  c: string;
  /** Mongolian label (may be empty / "—"). */
  name: string;
  icon: string;
  /** Chinese label, e.g. 言字旁. */
  nameZh?: string;
  /** sem = утга заагч / 形旁, pho = дуудлага заагч / 声旁. */
  role?: "sem" | "pho";
  kind?: "radical" | "stroke" | "other" | "char";
  /** Pinyin of the phonetic part. */
  py?: string;
  /** Second-level parts (e.g. 射 → 身 + 寸). */
  sub?: DecompositionSubPart[];
};

export {
  getCharBreakdownView,
  hasCharBreakdown,
  resolveBreakdownCharsForText,
  type CharBreakdownView,
};

const HANZI_RE = /[一-鿿]/;

/**
 * Unique hanzi of a word, as stub views — each hint component loads its own
 * breakdown from the dataset (char_breakdown_full.json) and hides itself when
 * there is nothing to show.
 */
export function resolveDecompositionCharacters(
  zh: string,
  _lessonCharacters: unknown[] = []
): { char: string }[] {
  const seen = new Set<string>();
  const out: { char: string }[] = [];
  for (const ch of zh.trim()) {
    if (!HANZI_RE.test(ch) || seen.has(ch)) continue;
    seen.add(ch);
    out.push({ char: ch });
  }
  return out;
}
