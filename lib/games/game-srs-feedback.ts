"use client";

/**
 * Тоглоомын хариултыг цээжлэх үгийн SRS-тэй холбоно.
 * Зөв хариулсан үг → «known» (давталтын хугацаа уртасна), буруу → «forgot» (удахгүй дахин гарна).
 * Нэвтэрсэн бол Supabase user_word_srs, зочин бол төхөөрөмж дээрх SRS.
 * Fire-and-forget: тоглоомыг удаашруулахгүй, алдаа гарвал чимээгүй.
 */

import { rateLocalWordSrs } from "@/lib/srs/local-word-srs";
import type { WordSrsRow } from "@/lib/srs/word-srs-types";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { rateWordSrs } from "@/lib/supabase/user-word-srs";

let userIdPromise: Promise<string | null> | null = null;
function userId(): Promise<string | null> {
  if (!userIdPromise) {
    userIdPromise = hasSupabaseConfig
      ? getAuthenticatedUserId()
          .then((r) => r.userId)
          .catch(() => null)
      : Promise.resolve(null);
    // 2 минутын дараа дахин шалгана (нэвтрэх/гарах өөрчлөлт)
    setTimeout(() => {
      userIdPromise = null;
    }, 120_000);
  }
  return userIdPromise;
}

async function existingRow(uid: string, wordId: number): Promise<WordSrsRow | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_word_srs")
    .select("*")
    .eq("user_id", uid)
    .eq("word_id", wordId)
    .maybeSingle();
  return (data as WordSrsRow | null) ?? null;
}

/** Нэг үгийн тоглоомын үр дүнг SRS-д бүртгэнэ. wordId = hsk_words.id */
export function rateGameWord(wordId: number | null | undefined, correct: boolean): void {
  if (!wordId || !Number.isFinite(wordId)) return;
  const rating = correct ? "known" : "forgot";
  void (async () => {
    try {
      const uid = await userId();
      if (uid && supabase) {
        const existing = await existingRow(uid, wordId);
        // Шинэ үг зөв бол SRS-д нэмэхгүй — зөвхөн аль хэдийн сурч буй эсвэл алдсан үг орно.
        if (!existing && correct) return;
        await rateWordSrs(uid, wordId, rating, existing);
      } else {
        rateLocalWordSrs(wordId, rating, null);
      }
    } catch {
      /* чимээгүй */
    }
  })();
}

/** Тоглоомын төгсгөлд багцаар бүртгэх хувилбар. */
export function rateGameWords(results: { wordId: number | null | undefined; correct: boolean }[]): void {
  const seen = new Set<number>();
  for (const r of results) {
    if (!r.wordId || seen.has(r.wordId)) continue;
    seen.add(r.wordId);
    rateGameWord(r.wordId, r.correct);
  }
}

// ---- Ханзаар (хичээлийн үг hsk_words id-гүй тул) ----
const hanziIdCache = new Map<string, Promise<number | null>>();

/** Энгийн ханз → hsk_words.id (кэштэй). Олдохгүй бол null. */
export function lookupWordIdByHanzi(hanzi: string): Promise<number | null> {
  const key = hanzi.trim();
  if (!key || !supabase) return Promise.resolve(null);
  let p = hanziIdCache.get(key);
  if (!p) {
    const client = supabase;
    p = (async () => {
      try {
        const { data } = await client
          .from("hsk_words")
          .select("id")
          .eq("simplified", key)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();
        return (data?.id as number | undefined) ?? null;
      } catch {
        return null;
      }
    })();
    hanziIdCache.set(key, p);
  }
  return p;
}

/** Хичээлийн тоглоомд: ханзаар нь SRS-д бүртгэнэ (HSK үгийн санд байвал). */
export function rateGameWordByHanzi(hanzi: string | null | undefined, correct: boolean): void {
  if (!hanzi) return;
  void lookupWordIdByHanzi(hanzi).then((id) => rateGameWord(id, correct));
}
