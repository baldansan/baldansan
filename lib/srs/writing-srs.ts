"use client";

/**
 * БИЧИХ SRS — үг/ханз бүрд «гараар бичиж чадах» тусдаа давталтын төлөв.
 * Уншиж таних SRS (user_word_srs)-ээс ТУСДАА: уншиж чаддаг ч бичиж
 * чаддаггүй байх нь түгээмэл тул бичих ой өөрийн хуваарьтай мартагдана.
 *
 * Хадгалалт: localStorage үндсэн (зочин + офлайн), нэвтэрсэн үед
 * user_writing_srs хүснэгтэд давхар бичиж, ачаалахад нэгтгэнэ.
 * Түлхүүр = simplified текст (хичээлийн ханз id-гүй байдаг тул).
 */

import {
  applyWordSrsRating,
  initialWordSrsSchedule,
} from "@/lib/srs/word-srs-scheduler";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";

export type WritingSrsEntry = {
  /** simplified үг/ханз — түлхүүр */
  key: string;
  wordId: number | null;
  pinyin: string | null;
  meaning: string | null;
  reps: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_rating: WordSrsRating | null;
  updated_at: string;
};

export type WritingResult = {
  /** hanzi-writer quiz-ийн буруу зураасны нийт тоо */
  mistakes: number;
  /** Сануулга (outline) харсан эсэх */
  usedHint: boolean;
};

const STORE_KEY = "buunduu-writing-srs-v1";

function readStore(): Record<string, WritingSrsEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WritingSrsEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, WritingSrsEntry>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Storage дүүрсэн — чимээгүй үргэлжилнэ.
  }
}

/** Бичилтийн бодит гүйцэтгэлээс SRS үнэлгээ гаргана. */
export function ratingFromWritingResult(result: WritingResult): WordSrsRating {
  if (result.usedHint || result.mistakes >= 3) return "forgot";
  if (result.mistakes >= 1) return "hard";
  return "known";
}

export type WritingWordMeta = {
  key: string;
  wordId?: number | null;
  pinyin?: string | null;
  meaning?: string | null;
};

/** Бичилтийг үнэлж хуваарийг шинэчилнэ (локал). Шинэ үг бол entry үүсгэнэ. */
export function rateLocalWritingSrs(
  meta: WritingWordMeta,
  rating: WordSrsRating,
  now: Date = new Date()
): WritingSrsEntry {
  const key = meta.key.trim();
  const store = readStore();
  const prev = store[key];
  const state = prev
    ? { reps: prev.reps, ease: prev.ease, interval_days: prev.interval_days }
    : initialWordSrsSchedule();
  const update = applyWordSrsRating(state, rating, now);
  const entry: WritingSrsEntry = {
    key,
    wordId: meta.wordId ?? prev?.wordId ?? null,
    pinyin: meta.pinyin ?? prev?.pinyin ?? null,
    meaning: meta.meaning ?? prev?.meaning ?? null,
    reps: update.reps,
    ease: update.ease,
    interval_days: update.interval_days,
    due_at: update.due_at.toISOString(),
    last_rating: update.last_rating,
    updated_at: now.toISOString(),
  };
  store[key] = entry;
  writeStore(store);
  return entry;
}

/** Бичээгүй шинэ үгийг «маргааш due» болгож нэмнэ (байгаа бол өөрчлөхгүй). */
export function seedLocalWritingSrs(
  meta: WritingWordMeta,
  now: Date = new Date()
): boolean {
  const key = meta.key.trim();
  if (!key) return false;
  const store = readStore();
  if (store[key]) return false;
  store[key] = {
    key,
    wordId: meta.wordId ?? null,
    pinyin: meta.pinyin ?? null,
    meaning: meta.meaning ?? null,
    reps: 0,
    ease: 2.5,
    interval_days: 1,
    due_at: new Date(now.getTime() + 86_400_000).toISOString(),
    last_rating: null,
    updated_at: now.toISOString(),
  };
  writeStore(store);
  return true;
}

/** Хугацаа нь болсон (due) бичих картууд — хамгийн эртнийх нь эхэндээ. */
export function getDueLocalWritingItems(
  limit = 20,
  now: Date = new Date()
): WritingSrsEntry[] {
  const store = readStore();
  const nowMs = now.getTime();
  return Object.values(store)
    .filter(
      (e) => e.meaning && new Date(e.due_at).getTime() <= nowMs
    )
    .sort(
      (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    )
    .slice(0, limit);
}

export function countDueLocalWriting(now: Date = new Date()): number {
  const store = readStore();
  const nowMs = now.getTime();
  return Object.values(store).filter(
    (e) => e.meaning && new Date(e.due_at).getTime() <= nowMs
  ).length;
}

export function countAllLocalWriting(): number {
  return Object.keys(readStore()).length;
}

/** Серверээс ирсэн мөрүүдийг локалтай нэгтгэнэ (шинэ нь ялна). */
export function mergeServerWritingEntries(entries: WritingSrsEntry[]) {
  if (entries.length === 0) return;
  const store = readStore();
  for (const entry of entries) {
    const local = store[entry.key];
    if (
      !local ||
      new Date(entry.updated_at).getTime() >
        new Date(local.updated_at).getTime()
    ) {
      store[entry.key] = entry;
    }
  }
  writeStore(store);
}

/** Серверт илгээх бүх локал мөр (эхний sync-д). */
export function getAllLocalWritingEntries(): WritingSrsEntry[] {
  return Object.values(readStore());
}
