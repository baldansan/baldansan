"use client";

/**
 * Бичих SRS-ийн серверийн тольдолт (user_writing_srs).
 * Локал storage үндсэн; нэвтэрсэн үед энд давхар бичиж, ачаалахад нэгтгэнэ.
 * Бүх алдааг чимээгүй залгина — бичих дасгал офлайн ч ажиллах ёстой.
 */

import type { WritingSrsEntry } from "@/lib/srs/writing-srs";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

type WritingSrsDbRow = {
  word_key: string;
  word_id: number | null;
  pinyin: string | null;
  meaning_mn: string | null;
  reps: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_rating: WritingSrsEntry["last_rating"];
  updated_at: string;
};

function rowToEntry(row: WritingSrsDbRow): WritingSrsEntry {
  return {
    key: row.word_key,
    wordId: row.word_id,
    pinyin: row.pinyin,
    meaning: row.meaning_mn,
    reps: row.reps,
    ease: row.ease,
    interval_days: row.interval_days,
    due_at: row.due_at,
    last_rating: row.last_rating,
    updated_at: row.updated_at,
  };
}

/** Нэвтэрсэн хэрэглэгчийн бүх бичих SRS мөрийг татна (нэгтгэхэд). */
export async function fetchServerWritingEntries(
  userId: string
): Promise<WritingSrsEntry[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("user_writing_srs")
      .select(
        "word_key, word_id, pinyin, meaning_mn, reps, ease, interval_days, due_at, last_rating, updated_at"
      )
      .eq("user_id", userId)
      .limit(2000);
    if (error || !data) return [];
    return (data as WritingSrsDbRow[]).map(rowToEntry);
  } catch {
    return [];
  }
}

/** Локал entry-г серверт upsert хийнэ (fire-and-forget). */
export async function upsertServerWritingEntry(
  userId: string,
  entry: WritingSrsEntry
): Promise<void> {
  if (!hasSupabaseConfig || !supabase) return;
  try {
    await supabase.from("user_writing_srs").upsert(
      {
        user_id: userId,
        word_key: entry.key,
        word_id: entry.wordId,
        pinyin: entry.pinyin,
        meaning_mn: entry.meaning,
        reps: entry.reps,
        ease: entry.ease,
        interval_days: entry.interval_days,
        due_at: entry.due_at,
        last_rating: entry.last_rating,
      },
      { onConflict: "user_id,word_key" }
    );
  } catch {
    // чимээгүй
  }
}
