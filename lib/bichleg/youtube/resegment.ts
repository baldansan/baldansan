import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildRows } from "./build";
import { hasTranslateKey } from "./claude";

type StoredWord = { zh?: string; pinyin?: string; mn?: string; key?: boolean };
type StoredRow = Record<string, unknown> & {
  id: string;
  idx: number;
  zh: string | null;
  words: StoredWord[] | null;
};

export type ResegmentResult = {
  videoId: string;
  rows: number;
  changedRows: number;
  wordsBefore: number;
  wordsAfter: number;
  /** Толийн бүтэн үг болж нийлсэн үгийн тоо */
  mergedWords: number;
  /** Толинд байхгүй тул салгасан наалдмал хэсгийн тоо */
  splitWords: number;
};

/**
 * Нэг бичлэгийн хадгалагдсан хадмалыг дахин үгээр задална: ганц ханзаар тасарсан
 * хэсгүүдийг толь бичгийн бүтэн үг болгож нийлүүлнэ. Монгол орчуулга, цаг, мөрийн
 * текст хөндөгдөхгүй — зөвхөн `words` (ба үгээр зайлсан `pinyin`) шинэчлэгдэнэ.
 */
export async function resegmentVideo(client: SupabaseClient, videoId: string): Promise<ResegmentResult> {
  const stored: StoredRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client
      .from("video_subtitles")
      .select("*")
      .eq("video_id", videoId)
      .order("idx", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    stored.push(...((data ?? []) as StoredRow[]));
    if (!data || data.length < 1000) break;
  }

  const withText = stored.filter((r) => (r.zh ?? "").trim().length > 0);
  if (!withText.length) {
    return { videoId, rows: stored.length, changedRows: 0, wordsBefore: 0, wordsAfter: 0, mergedWords: 0, splitWords: 0 };
  }

  // Өмнөх үгийн утгыг хадгална (гараар зассан / AI-аар гаргасан байж болно).
  const existingGloss = new Map<string, string>();
  let wordsBefore = 0;
  for (const row of withText) {
    for (const w of row.words ?? []) {
      wordsBefore += 1;
      const zh = String(w.zh ?? "");
      const mn = String(w.mn ?? "").trim();
      if (zh && mn && mn !== zh && !existingGloss.has(zh)) existingGloss.set(zh, mn);
    }
  }

  const built = await buildRows(
    client,
    withText.map((r) => String(r.zh)),
    { existingGloss, useAi: hasTranslateKey }
  );

  let wordsAfter = 0;
  const updates: Record<string, unknown>[] = [];
  withText.forEach((row, i) => {
    const next = built.rows[i];
    wordsAfter += next.words.length;
    const before = (row.words ?? []).map((w) => String(w.zh ?? "")).join("|");
    const after = next.words.map((w) => w.zh).join("|");
    if (before === after) return;
    updates.push({ ...row, words: next.words, pinyin: next.pinyin });
  });

  for (let i = 0; i < updates.length; i += 200) {
    const { error } = await client
      .from("video_subtitles")
      .upsert(updates.slice(i, i + 200), { onConflict: "video_id,idx" });
    if (error) throw new Error(error.message);
  }

  return {
    videoId,
    rows: stored.length,
    changedRows: updates.length,
    wordsBefore,
    wordsAfter,
    mergedWords: built.mergedWords,
    splitWords: built.splitWords,
  };
}
