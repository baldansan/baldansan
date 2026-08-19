"use client";

/**
 * Бичилтийн үр дүнг нэг дороос бүртгэх туслах:
 * гүйцэтгэл → үнэлгээ → локал хуваарь → (нэвтэрсэн бол) сервер тольдолт.
 */

import {
  rateLocalWritingSrs,
  ratingFromWritingResult,
  type WritingResult,
  type WritingSrsEntry,
  type WritingWordMeta,
} from "@/lib/srs/writing-srs";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { upsertServerWritingEntry } from "@/lib/supabase/user-writing-srs";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";

let cachedUserId: string | null | undefined;

async function resolveUserId(): Promise<string | null> {
  if (!hasSupabaseConfig) return null;
  if (cachedUserId !== undefined) return cachedUserId;
  try {
    const { userId } = await getAuthenticatedUserId();
    cachedUserId = userId ?? null;
  } catch {
    cachedUserId = null;
  }
  return cachedUserId;
}

/** Бичилт дуусахад дуудна. Үнэлгээ + шинэ entry-г буцаана. */
export function recordWritingResult(
  meta: WritingWordMeta,
  result: WritingResult
): { rating: WordSrsRating; entry: WritingSrsEntry } {
  const rating = ratingFromWritingResult(result);
  const entry = rateLocalWritingSrs(meta, rating);
  void resolveUserId().then((userId) => {
    if (userId) void upsertServerWritingEntry(userId, entry);
  });
  return { rating, entry };
}
