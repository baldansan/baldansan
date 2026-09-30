import { applyWordSrsRating, initialWordSrsSchedule } from "@/lib/srs/word-srs-scheduler";
import type { WordSrsRating } from "@/lib/srs/word-srs-types";

/**
 * Өгүүлбэрийн карт — бичлэгээс бүтэн өгүүлбэрийг цагтай нь хадгалж, SRS-ээр давтана.
 * Энэ төхөөрөмжийн localStorage-д хадгална (зочин, нэвтэрсэн аль аль нь ажиллана).
 */
export type SentenceCard = {
  /** `${videoId}:${idx}` */
  id: string;
  videoId: string;
  seriesId: string | null;
  videoTitle: string | null;
  idx: number;
  startSec: number;
  endSec: number;
  zh: string;
  pinyin: string | null;
  mn: string | null;
  savedAt: string;
  reps: number;
  ease: number;
  intervalDays: number;
  dueAt: string;
  lastRating: WordSrsRating | null;
};

const STORAGE_KEY = "buunduu-sentence-cards-v1";
const CHANGE_EVENT = "buunduu-sentence-cards-change";

type Store = { cards: Record<string, SentenceCard> };

function readStore(): Store {
  if (typeof window === "undefined") return { cards: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cards: {} };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return { cards: parsed.cards ?? {} };
  } catch {
    return { cards: {} };
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable */
  }
}

export function sentenceCardId(videoId: string, idx: number): string {
  return `${videoId}:${idx}`;
}

export function listSentenceCards(): SentenceCard[] {
  return Object.values(readStore().cards).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function hasSentenceCard(videoId: string, idx: number): boolean {
  return Boolean(readStore().cards[sentenceCardId(videoId, idx)]);
}

/** Тухайн бичлэгийн хадгалсан өгүүлбэрийн idx-үүд. */
export function savedSentenceIdxSet(videoId: string): Set<number> {
  const out = new Set<number>();
  for (const c of Object.values(readStore().cards)) if (c.videoId === videoId) out.add(c.idx);
  return out;
}

export function saveSentenceCard(input: {
  videoId: string;
  seriesId?: string | null;
  videoTitle?: string | null;
  idx: number;
  startSec: number;
  endSec: number;
  zh: string;
  pinyin?: string | null;
  mn?: string | null;
}): { ok: boolean; duplicate: boolean; card: SentenceCard } {
  const store = readStore();
  const id = sentenceCardId(input.videoId, input.idx);
  const existing = store.cards[id];
  if (existing) return { ok: true, duplicate: true, card: existing };
  const sched = initialWordSrsSchedule();
  const now = new Date();
  const card: SentenceCard = {
    id,
    videoId: input.videoId,
    seriesId: input.seriesId ?? null,
    videoTitle: input.videoTitle ?? null,
    idx: input.idx,
    startSec: input.startSec,
    endSec: input.endSec,
    zh: input.zh.trim(),
    pinyin: input.pinyin?.trim() || null,
    mn: input.mn?.trim() || null,
    savedAt: now.toISOString(),
    reps: sched.reps,
    ease: sched.ease,
    intervalDays: sched.interval_days,
    dueAt: now.toISOString(),
    lastRating: null,
  };
  store.cards[id] = card;
  writeStore(store);
  return { ok: true, duplicate: false, card };
}

export function removeSentenceCard(id: string): void {
  const store = readStore();
  if (!store.cards[id]) return;
  delete store.cards[id];
  writeStore(store);
}

/** Давталтын үнэлгээ өгөх (SM-2-lite, үгийн SRS-тэй адил). */
export function rateSentenceCard(id: string, rating: WordSrsRating, now: Date = new Date()): SentenceCard | null {
  const store = readStore();
  const card = store.cards[id];
  if (!card) return null;
  const next = applyWordSrsRating(
    { reps: card.reps, ease: card.ease, interval_days: card.intervalDays },
    rating,
    now
  );
  const updated: SentenceCard = {
    ...card,
    reps: next.reps,
    ease: next.ease,
    intervalDays: next.interval_days,
    dueAt: next.due_at.toISOString(),
    lastRating: next.last_rating,
  };
  store.cards[id] = updated;
  writeStore(store);
  return updated;
}

export function getDueSentenceCards(now: Date = new Date()): SentenceCard[] {
  const t = now.getTime();
  return listSentenceCards()
    .filter((c) => new Date(c.dueAt).getTime() <= t)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export function countSentenceCards(now: Date = new Date()): { total: number; due: number } {
  const all = listSentenceCards();
  const t = now.getTime();
  return { total: all.length, due: all.filter((c) => new Date(c.dueAt).getTime() <= t).length };
}

/** Бичлэг дээр яг тэр өгүүлбэрээс тоглуулах холбоос. */
export function sentenceCardHref(card: SentenceCard): string {
  const series = card.seriesId ?? "other";
  return `/bichleg/${encodeURIComponent(series)}/${encodeURIComponent(card.videoId)}?t=${Math.max(0, Math.floor(card.startSec))}`;
}

export function subscribeSentenceCards(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
