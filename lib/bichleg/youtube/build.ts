import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { pinyin } from "pinyin-pro";
import baseGloss from "./gloss-mn.json";
import { callClaude, GLOSS_RULES, parseNumbered } from "./claude";
import { mergeCandidates, mergeTokens, splitUnknown, type KnownWordKind } from "./merge-words";

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

type KnownInfo = { kind: KnownWordKind; mn: string; level: number };

/** Өгөгдсөн үгсээс толь бичигт (HSK → CC-CEDICT лексикон) байгааг нь утгатай нь авна. */
async function loadKnownWords(client: SupabaseClient, words: string[]): Promise<Map<string, KnownInfo>> {
  const known = new Map<string, KnownInfo>();
  const CHUNK = 120; // GET URL-ийн уртад багтаана
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += CHUNK) chunks.push(words.slice(i, i + CHUNK));
  const POOL = 4; // өгөгдлийн санг дарахгүй
  for (let i = 0; i < chunks.length; i += POOL) {
    await Promise.all(
      chunks.slice(i, i + POOL).map(async (chunk) => {
        const [hskRes, lexRes] = await Promise.all([
          client.from("hsk_words").select("simplified, meaning_mn, hsk_level").in("simplified", chunk),
          client
            .from("dictionary_lexicon")
            .select("simplified, meaning_mn")
            .eq("kind", "word")
            .in("simplified", chunk),
        ]);
        for (const row of (lexRes.data ?? []) as { simplified: string; meaning_mn: string | null }[]) {
          const prev = known.get(row.simplified);
          if (!prev || (!prev.mn && row.meaning_mn)) {
            known.set(row.simplified, { kind: "lexicon", mn: row.meaning_mn ?? "", level: 0 });
          }
        }
        for (const row of (hskRes.data ?? []) as {
          simplified: string;
          meaning_mn: string | null;
          hsk_level: string | null;
        }[]) {
          const prev = known.get(row.simplified);
          if (prev?.kind === "hsk" && prev.mn) continue;
          const level = parseInt(String(row.hsk_level ?? "0").split("-")[0], 10) || 0;
          known.set(row.simplified, { kind: "hsk", mn: row.meaning_mn ?? prev?.mn ?? "", level });
        }
      })
    );
  }
  return known;
}

/** Лексиконы «a; b; c; d…» урт утгыг хадмалын цонхонд тааруулж богиносгоно. */
function shortGloss(mn: string): string {
  const parts = mn.split(/\s*;\s*/).filter(Boolean);
  return parts.slice(0, 3).join("; ");
}

export type BuildOptions = {
  /** Өмнө нь гаргасан үгийн утга (zh → mn) — дахин задлахад хадгална. */
  existingGloss?: Map<string, string>;
  /** false бол толинд байхгүй үгийг AI-аар тайлбарлуулахгүй. */
  useAi?: boolean;
};

export async function buildRows(
  client: SupabaseClient,
  linesZh: string[],
  options: BuildOptions = {}
): Promise<{ rows: BuiltRow[]; glossedByAi: number; mergedWords: number }> {
  const existing = options.existingGloss ?? new Map<string, string>();
  const useAi = options.useAi ?? true;
  const cleaned = linesZh.map(sanitizeZh);
  const base = cleaned.map(segment);

  // 1) Segmenter-ийн хэсгүүд толинд байгаа эсэх
  const first = new Set<string>();
  for (const tokens of base) for (const w of tokens) if (CJK.test(w)) first.add(w);
  const known = await loadKnownWords(client, [...first]);
  const isWord = (w: string) => Boolean(GLOSS[w]) || known.has(w);

  // 2) Толинд байхгүй наалдмал хэсгийг ханзаар салгаад, нийлж болзошгүй хослолыг шалгана
  const units = base.map((tokens) => splitUnknown(tokens, isWord));
  const second = new Set<string>();
  for (const tokens of units) {
    for (const w of tokens) if (CJK.test(w) && !known.has(w)) second.add(w);
    for (const c of mergeCandidates(tokens)) if (!known.has(c)) second.add(c);
  }
  for (const [w, info] of await loadKnownWords(client, [...second])) known.set(w, info);

  const kinds = new Map<string, KnownWordKind>();
  for (const [w, info] of known) kinds.set(w, info.kind);
  for (const w of Object.keys(GLOSS)) if (CJK.test(w) && [...w].length >= 2) kinds.set(w, "hsk");

  // 3) Тасархай хэсгүүдийг бүтэн үг болгож нийлүүлнэ
  let mergedWords = 0;
  const segmented = units.map((tokens) => {
    const merged = mergeTokens(tokens, kinds);
    mergedWords += tokens.length - merged.length;
    return merged;
  });

  const unique = new Set<string>();
  for (const words of segmented) for (const w of words) if (CJK.test(w)) unique.add(w);

  const hsk = new Map<string, { mn: string; level: number }>();
  const lex = new Map<string, string>();
  for (const w of unique) {
    const info = known.get(w);
    if (!info?.mn) continue;
    if (info.kind === "hsk") hsk.set(w, { mn: info.mn, level: info.level });
    else lex.set(w, shortGloss(info.mn));
  }

  // 4) Үлдсэнийг AI-аар тайлбарлуулна
  const missing = [...unique].filter((w) => !GLOSS[w] && !hsk.has(w) && !lex.has(w) && !existing.get(w));
  const ai = new Map<string, string>();
  if (useAi && missing.length) {
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
  }

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
      const mn = GLOSS[w] ?? fromHsk?.mn ?? existing.get(w) ?? lex.get(w) ?? ai.get(w) ?? w;
      const word: BuiltWord = { zh: w, pinyin: wordPy || py(w), mn };
      if (!GLOSS[w] && fromHsk && w.length >= 2 && fromHsk.level >= 3 && keys < 2) {
        word.key = true;
        keys += 1;
      }
      return word;
    });
    return { zh, pinyin: words.map((w) => w.pinyin).join(" "), words };
  });

  return { rows, glossedByAi: ai.size, mergedWords };
}
