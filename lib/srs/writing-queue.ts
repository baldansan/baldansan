"use client";

/**
 * БИЧИХ ЖАГСААЛТ — «Миний үгс»-ийн цээжилж буй үгсийг гараар бичиж цээжлэх дараалал.
 *
 * Давтах үгийн логиктой нэг (claude/REVIEW-WORDS-MODEL-2026-11-18.md):
 * - Жагсаалт = хэрэглэгчийн өөрөө сонгосон, хараахан цээжлээгүй үгс (user_word_srs).
 * - Бичих ахиц тусдаа хадгалагдана (user_writing_srs / локал).
 * - Бичиж цээжилсэн (interval >= 21 хоног) үг жагсаалтаас хасагдана.
 * - Өдөр хүлээлгэхгүй: давтах хугацаа нь болсон нь эхэнд, шинэ үг араас нь.
 *
 * Нэвтрээгүй хүнд локал бичих бүртгэлээс (өөрийн бичиж үзсэн үгс) дараална.
 */

import {
  getAllLocalWritingEntries,
  mergeServerWritingEntries,
  type WritingSrsEntry,
} from "@/lib/srs/writing-srs";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { fetchServerWritingEntries } from "@/lib/supabase/user-writing-srs";

/** Энэ хоногоос урт завсартай = «бичиж цээжилсэн» (уншихын 21 хоногтой ижил). */
export const WRITING_MASTERED_INTERVAL_DAYS = 21;
const LEARNING_WORD_LIMIT = 500;
const CJK_RE = /[㐀-鿿]/;

export type WritingQueueItem = {
  key: string;
  wordId: number | null;
  pinyin: string | null;
  meaning: string | null;
  /** Хараахан нэг ч удаа бичээгүй — эхлээд дагаж зурна. */
  isNew: boolean;
};

export type WritingQueue = {
  /** Бичиж буй (хараахан бичиж цээжлээгүй) үгийн нийт тоо. */
  learning: number;
  /** Бичиж цээжилсэн үгийн тоо. */
  mastered: number;
  items: WritingQueueItem[];
};

type Candidate = {
  key: string;
  wordId: number | null;
  pinyin: string | null;
  meaning: string | null;
};

function isWritingMastered(entry: WritingSrsEntry | undefined): boolean {
  return Number(entry?.interval_days ?? 0) >= WRITING_MASTERED_INTERVAL_DAYS;
}

function hasWritten(entry: WritingSrsEntry | undefined): boolean {
  return Boolean(entry && entry.last_rating);
}

async function fetchLearningWords(userId: string): Promise<Candidate[] | null> {
  if (!supabase) return null;
  const { data: srsRows, error } = await supabase
    .from("user_word_srs")
    .select("word_id")
    .eq("user_id", userId)
    .lt("interval_days", WRITING_MASTERED_INTERVAL_DAYS)
    .order("due_at", { ascending: true })
    .limit(LEARNING_WORD_LIMIT);
  if (error) return null;

  const ids = [...new Set((srsRows ?? []).map((r) => r.word_id as number))];
  const byId = new Map<number, Candidate>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error: wordError } = await supabase
      .from("hsk_words")
      .select("id, simplified, pinyin, meaning_mn")
      .in("id", ids.slice(i, i + 200));
    if (wordError) return null;
    for (const row of data ?? []) {
      const key = String(row.simplified ?? "").trim();
      if (!key || !CJK_RE.test(key)) continue;
      byId.set(row.id as number, {
        key,
        wordId: row.id as number,
        pinyin: (row.pinyin as string | null) ?? null,
        meaning: (row.meaning_mn as string | null) ?? null,
      });
    }
  }
  // «Миний үгс»-ийн дарааллыг хадгална.
  return ids.map((id) => byId.get(id)).filter((c): c is Candidate => Boolean(c));
}

export async function loadWritingQueue(limit = 15): Promise<WritingQueue> {
  let candidates: Candidate[] | null = null;

  if (hasSupabaseConfig) {
    try {
      const { userId } = await getAuthenticatedUserId();
      if (userId) {
        const [words, server] = await Promise.all([
          fetchLearningWords(userId),
          fetchServerWritingEntries(userId),
        ]);
        mergeServerWritingEntries(server);
        candidates = words;
      }
    } catch {
      // офлайн — локалоороо үргэлжилнэ
    }
  }

  const store = new Map(getAllLocalWritingEntries().map((e) => [e.key, e]));

  if (!candidates) {
    // Нэвтрээгүй / офлайн: өөрийн бичиж үзсэн үгсээс.
    candidates = [...store.values()]
      .filter((e) => e.meaning && hasWritten(e))
      .map((e) => ({
        key: e.key,
        wordId: e.wordId,
        pinyin: e.pinyin,
        meaning: e.meaning,
      }));
  }

  const seen = new Set<string>();
  const written: { item: WritingQueueItem; due: number }[] = [];
  const fresh: WritingQueueItem[] = [];
  let mastered = 0;

  for (const c of candidates) {
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    const entry = store.get(c.key);
    if (isWritingMastered(entry)) {
      mastered += 1;
      continue;
    }
    const item: WritingQueueItem = {
      key: c.key,
      wordId: c.wordId,
      pinyin: c.pinyin ?? entry?.pinyin ?? null,
      meaning: c.meaning ?? entry?.meaning ?? null,
      isNew: !hasWritten(entry),
    };
    if (!item.meaning) continue;
    if (item.isNew) fresh.push(item);
    else written.push({ item, due: new Date(entry!.due_at).getTime() });
  }

  written.sort((a, b) => a.due - b.due);
  const ordered = [...written.map((w) => w.item), ...fresh];

  return {
    learning: ordered.length,
    mastered,
    items: ordered.slice(0, limit),
  };
}
