import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { DictEntry, DictSense } from "@/lib/dictionary/types";

export type ApprovedDictionary = {
  entry: Pick<DictEntry, "usage_note_mn" | "measure_words" | "collocations" | "confusable_with" | "register"> | null;
  senses: DictSense[];
};

/** Сурагч талд: зөвхөн approved утгууд (RLS өөрөө шүүнэ). Үг бүрт нэг л удаа татна. */
export async function fetchApprovedDictionary(wordId: number): Promise<ApprovedDictionary | null> {
  if (!supabase || !hasSupabaseConfig) return null;
  const [{ data: entry }, { data: senseRows }] = await Promise.all([
    supabase
      .from("dictionary_entries")
      .select("usage_note_mn, measure_words, collocations, confusable_with, register")
      .eq("word_id", wordId)
      .eq("status", "approved")
      .maybeSingle(),
    supabase
      .from("dictionary_senses")
      .select("id, sense_no, pos, gloss_zh, meaning_mn, synonyms_mn, meaning_en, note_mn")
      .eq("word_id", wordId)
      .eq("status", "approved")
      .order("sense_no"),
  ]);
  if (!senseRows || senseRows.length === 0) return null;

  const ids = senseRows.map((s) => Number(s.id));
  const { data: exRows } = await supabase
    .from("dictionary_examples")
    .select("id, sense_id, example_no, zh, pinyin, mn")
    .in("sense_id", ids)
    .order("example_no");
  const bySense = new Map<number, DictSense["examples"]>();
  for (const ex of exRows ?? []) {
    const k = Number(ex.sense_id);
    const l = bySense.get(k) ?? [];
    l.push({ id: Number(ex.id), zh: String(ex.zh), pinyin: (ex.pinyin as string | null) ?? null, mn: String(ex.mn) });
    bySense.set(k, l);
  }
  return {
    entry: entry
      ? {
          usage_note_mn: (entry.usage_note_mn as string | null) ?? null,
          measure_words: (entry.measure_words as string[] | null) ?? [],
          collocations: Array.isArray(entry.collocations) ? (entry.collocations as DictEntry["collocations"]) : [],
          confusable_with: (entry.confusable_with as string[] | null) ?? [],
          register: (entry.register as string | null) ?? null,
        }
      : null,
    senses: senseRows.map((s) => ({
      id: Number(s.id),
      sense_no: Number(s.sense_no),
      pos: (s.pos as string | null) ?? null,
      gloss_zh: (s.gloss_zh as string | null) ?? null,
      meaning_mn: String(s.meaning_mn ?? ""),
      synonyms_mn: (s.synonyms_mn as string[] | null) ?? [],
      meaning_en: (s.meaning_en as string | null) ?? null,
      note_mn: (s.note_mn as string | null) ?? null,
      examples: bySense.get(Number(s.id)) ?? [],
    })),
  };
}
