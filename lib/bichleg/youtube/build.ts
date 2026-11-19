import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { pinyin } from "pinyin-pro";
import baseGloss from "./gloss-mn.json";
import { callClaude, GLOSS_RULES, parseNumbered } from "./claude";

/** Хятад мөрийг үгээр задалж, пиньинь + монгол утга өгнө (scripts/bichleg/build_series.py-тай ижил зарчим). */

export type BuiltWord = { zh: string; pinyin: string; mn: string; key?: boolean };
export type BuiltRow = { zh: string; pinyin: string; words: BuiltWord[] };

const CJK = /[一-鿿]/;
const WORDISH = /[\p{L}\p{N}_%]/u;
/** validate.normalizeZhForCompare-ийн хасдаг тэмдэгтүүд — мөрөнд үлдэж болно. */
const SAFE_PUNCT = /[，。！？、,.!?;；：:\s"'「」『』（）()【】[\]—\-…]/;

const GLOSS = baseGloss as Record<string, string>;

/** Шалгалтад унагах тэмдэгтийг (《》·～ гэх мэт) мөрөөс хасна. */
export function sanitizeZh(text: string): string {
  let out = "";
  for (const ch of text) {
    if (WORDISH.test(ch) || SAFE_PUNCT.test(ch)) out += ch;
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

function segment(text: string): string[] {
  const seg = new Intl.Segmenter("zh", { granularity: "word" });
  const out: string[] = [];
  for (const part of seg.segment(text)) {
    const w = part.segment.trim();
    if (!w || !WORDISH.test(w)) continue;
    out.push(w);
  }
  return out;
}

function py(word: string): string {
  return pinyin(word, { toneType: "symbol", type: "array", nonZh: "consecutive" }).join(" ");
}

export async function buildRows(
  client: SupabaseClient,
  linesZh: string[]
): Promise<{ rows: BuiltRow[]; glossedByAi: number }> {
  const cleaned = linesZh.map(sanitizeZh);
  const segmented = cleaned.map(segment);

  const unique = new Set<string>();
  for (const words of segmented) for (const w of words) if (CJK.test(w)) unique.add(w);

  // HSK үгсийн сангаас
  const hsk = new Map<string, { mn: string; level: number }>();
  const need = [...unique].filter((w) => !GLOSS[w]);
  for (let i = 0; i < need.length; i += 300) {
    const { data } = await client
      .from("hsk_words")
      .select("simplified, meaning_mn, hsk_level")
      .in("simplified", need.slice(i, i + 300));
    for (const row of (data ?? []) as {
      simplified: string;
      meaning_mn: string | null;
      hsk_level: string | null;
    }[]) {
      if (!row.meaning_mn || hsk.has(row.simplified)) continue;
      const level = parseInt(String(row.hsk_level ?? "0").split("-")[0], 10) || 0;
      hsk.set(row.simplified, { mn: row.meaning_mn, level });
    }
  }

  // Үлдсэнийг AI-аар тайлбарлуулна
  const missing = need.filter((w) => !hsk.has(w));
  const ai = new Map<string, string>();
  const chunks: string[][] = [];
  for (let i = 0; i < missing.length; i += 80) chunks.push(missing.slice(i, i + 80));
  await Promise.all(
    chunks.map(async (chunk) => {
      const answer = parseNumbered(
        await callClaude(GLOSS_RULES, chunk.map((w, i) => `${i + 1}|${w}`).join("\n"), 4000, "fast")
      );
      chunk.forEach((w, i) => {
        if (answer[i + 1]) ai.set(w, answer[i + 1]);
      });
    })
  );

  const rows: BuiltRow[] = cleaned.map((zh, i) => {
    // Пиньинийг мөрөөр нь бодуулна (了, 子, 不 зэргийн дуудлага орчноосоо хамаарна).
    const chars = [...zh];
    const linePy = pinyin(zh, { toneType: "symbol", type: "array" });
    const aligned = linePy.length === chars.length;
    let cursor = 0;
    let keys = 0;
    const words: BuiltWord[] = segmented[i].map((w) => {
      if (!CJK.test(w)) return { zh: w, pinyin: w, mn: GLOSS[w] ?? w };
      const wChars = [...w];
      let wordPy = "";
      if (aligned) {
        const at = chars.findIndex(
          (_, k) => k >= cursor && wChars.every((c, j) => chars[k + j] === c)
        );
        if (at >= 0) {
          wordPy = wChars
            .map((c, j) => (CJK.test(c) ? linePy[at + j] : c))
            .join(" ");
          cursor = at + wChars.length;
        }
      }
      const fromHsk = hsk.get(w);
      const mn = GLOSS[w] ?? fromHsk?.mn ?? ai.get(w) ?? w;
      const word: BuiltWord = { zh: w, pinyin: wordPy || py(w), mn };
      if (!GLOSS[w] && fromHsk && w.length >= 2 && fromHsk.level >= 3 && keys < 2) {
        word.key = true;
        keys += 1;
      }
      return word;
    });
    return { zh, pinyin: words.map((w) => w.pinyin).join(" "), words };
  });

  return { rows, glossedByAi: ai.size };
}
