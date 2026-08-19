"use client";

import { seedLocalNewWords } from "@/lib/srs/local-word-srs";
import { seedLocalWritingSrs } from "@/lib/srs/writing-srs";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { VocabularyWord } from "@/types/lesson";

export type SeedLessonWordsResult = {
  added: number;
  already: number;
};

const EMPTY_RESULT: SeedLessonWordsResult = { added: 0, already: 0 };
const DAY_MS = 86_400_000;

type SeedCandidateRow = {
  id: number;
  simplified: string;
  is_function_word: boolean | null;
};

/** Маргааш давтагдахаар товлох цаг (шинэ карт). */
function tomorrowIso(now: Date = new Date()): string {
  return new Date(now.getTime() + DAY_MS).toISOString();
}

/** Хичээлийн үгсийн ханзаар hsk_words-оос id-г нь олно (олдоогүйг алгасна). */
async function resolveWordIds(chineseWords: string[]): Promise<number[]> {
  if (!supabase || chineseWords.length === 0) return [];

  const idBySimplified = new Map<string, number>();
  for (let i = 0; i < chineseWords.length; i += 200) {
    const chunk = chineseWords.slice(i, i + 200);
    const { data, error } = await supabase
      .from("hsk_words")
      .select("id, simplified, is_function_word")
      .in("simplified", chunk);
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as SeedCandidateRow[]) {
      if (row.id == null || row.is_function_word) continue;
      if (!idBySimplified.has(row.simplified)) {
        idBySimplified.set(row.simplified, row.id);
      }
    }
  }
  return [...idBySimplified.values()];
}

async function seedForUser(
  userId: string,
  wordIds: number[]
): Promise<SeedLessonWordsResult> {
  if (!supabase || wordIds.length === 0) return EMPTY_RESULT;

  const existing = new Set<number>();
  for (let i = 0; i < wordIds.length; i += 200) {
    const chunk = wordIds.slice(i, i + 200);
    const { data, error } = await supabase
      .from("user_word_srs")
      .select("word_id")
      .eq("user_id", userId)
      .in("word_id", chunk);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      existing.add(row.word_id as number);
    }
  }

  const fresh = wordIds.filter((id) => !existing.has(id));
  if (fresh.length === 0) {
    return { added: 0, already: existing.size };
  }

  const dueAt = tomorrowIso();
  const payload = fresh.map((wordId) => ({
    user_id: userId,
    word_id: wordId,
    reps: 0,
    ease: 2.5,
    interval_days: 0,
    due_at: dueAt,
    last_rating: null,
  }));

  const { error: insertError } = await supabase
    .from("user_word_srs")
    .insert(payload);

  if (insertError) {
    // 23505 — race: аль хэдийн орсон гэж үзнэ. Бусад алдаанд чимээгүй.
    if (insertError.code === "23505") {
      return { added: 0, already: wordIds.length };
    }
    throw new Error(insertError.message);
  }

  return { added: fresh.length, already: existing.size };
}

/**
 * Хичээл дуусахад хичээлийн үгсийг SRS давталтад автоматаар товлоно.
 * - Аль хэдийн SRS-д байгаа үгсийг өөрчлөхгүй (already-д тоолно).
 * - Шинэ үгсийг «шинэ карт, маргааш due» байдлаар нэмнэ.
 * - Нэвтэрсэн бол user_word_srs, зочин бол local storage.
 * - Алдаа гарвал чимээгүй {0,0} буцаана — хичээл дуусахад саад болохгүй.
 */
export async function seedLessonWordsIntoSrs(
  lessonId: string,
  vocabulary: VocabularyWord[]
): Promise<SeedLessonWordsResult> {
  void lessonId;
  try {
    // Бичих SRS: хичээлийн ханзтай үгсийг «маргааш бичих» болгож нэмнэ
    // (байгааг өөрчлөхгүй, локал — эхний бичилтээр серверт синклэгдэнэ).
    for (const w of vocabulary ?? []) {
      const zh = (w.chinese ?? "").trim();
      if (!zh || !/[㐀-鿿]/.test(zh)) continue;
      seedLocalWritingSrs({
        key: zh,
        pinyin: w.pinyin?.trim() || null,
        meaning: w.mongolian?.trim() || null,
      });
    }

    if (!hasSupabaseConfig || !supabase) return EMPTY_RESULT;

    const chineseWords = [
      ...new Set(
        (vocabulary ?? [])
          .map((w) => (w.chinese ?? "").trim())
          .filter((w) => w.length > 0)
      ),
    ];
    if (chineseWords.length === 0) return EMPTY_RESULT;

    const wordIds = await resolveWordIds(chineseWords);
    if (wordIds.length === 0) return EMPTY_RESULT;

    const { userId } = await getAuthenticatedUserId().catch(() => ({
      userId: null,
    }));

    if (userId) {
      return await seedForUser(userId, wordIds);
    }

    return seedLocalNewWords(wordIds, tomorrowIso());
  } catch {
    return EMPTY_RESULT;
  }
}
