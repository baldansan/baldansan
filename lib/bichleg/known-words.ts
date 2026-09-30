"use client";

import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { fetchHskWordsByIds } from "@/lib/supabase/hsk-words";
import { getUserSrsWordList } from "@/lib/supabase/user-word-srs";
import { readLocalStudiedWordIds } from "@/lib/srs/local-word-srs";

export type WordFamiliarity = "known" | "learning" | "new";

export type KnownWordSets = {
  /** Давталтад орж, 3+ удаа зөв давтсан эсвэл 7+ хоногийн интервалтай — «мэдэх». */
  known: Set<string>;
  /** Давталтад орсон ч бататгаагүй — «сурч байгаа». */
  learning: Set<string>;
};

const KNOWN_REPS = 3;
const KNOWN_INTERVAL_DAYS = 7;

/**
 * Хэрэглэгчийн давталтын санд байгаа үгсийг ханзаар нь буцаана (бичлэгийн хадмалыг өнгөлөхөд).
 * Нэвтэрсэн бол user_word_srs, зочин бол localStorage-ийн SRS.
 */
export async function fetchKnownWordSets(): Promise<KnownWordSets> {
  const known = new Set<string>();
  const learning = new Set<string>();
  try {
    if (hasSupabaseConfig) {
      const { userId } = await getAuthenticatedUserId();
      if (userId) {
        const { items } = await getUserSrsWordList(userId);
        for (const it of items) {
          const zh = it.word.simplified?.trim();
          if (!zh) continue;
          if (it.srs.reps >= KNOWN_REPS || it.srs.interval_days >= KNOWN_INTERVAL_DAYS) known.add(zh);
          else learning.add(zh);
        }
        return { known, learning };
      }
    }
    const ids = readLocalStudiedWordIds();
    if (ids.length > 0) {
      const { data } = await fetchHskWordsByIds(ids);
      for (const w of data ?? []) {
        const zh = w.simplified?.trim();
        if (zh) learning.add(zh);
      }
    }
  } catch {
    /* сүлжээ/тохиргоо алдаа — өнгөгүй үлдээнэ */
  }
  return { known, learning };
}

export function familiarityOf(zh: string, sets: KnownWordSets | null): WordFamiliarity {
  if (!sets) return "new";
  if (sets.known.has(zh)) return "known";
  if (sets.learning.has(zh)) return "learning";
  return "new";
}
