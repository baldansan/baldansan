"use client";

/**
 * ХАНЗНЫ ТҮҮХ — ханз бүрийг хэзээ, хэдэн удаа бичсэн, хэдэн удаа алдсаныг НЭГ газар бүртгэнэ.
 *
 * Гурван систем бүгд энд бичнэ:
 *   book   = Ханзны дэвтэр (/writing/..., хичээлийн ханз)
 *   review = Давтах → Бичих (/review/writing)
 *   hsk    = HSK ханз дарааллаар (/kanji/handwriting)
 *
 * Хадгалалт: үндсэн нь localStorage (офлайн, зочин, SQL ажиллаагүй үед ч ажиллана).
 * Нэвтэрсэн бол Supabase `user_hanzi_history` (migration 120) руу давхар бичиж,
 * самбар нээхэд нэгтгэнэ. Хүснэгт байхгүй бол чимээгүй алгасна.
 *
 * ДҮРЭМ: `inReview` (Давтах → Бичих хуваарьт орох эсэх) нь ЗӨВХӨН сурагч өөрөө
 * зөвшөөрөхөд true болно. Энэ файл түүнийг хэзээ ч автоматаар асаахгүй.
 */
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export const HANZI_HISTORY_KEY = "buunduu-hanzi-history-v1";
export const HANZI_HISTORY_EVENT = "buunduu-hanzi-history-change";

export type HanziSource = "book" | "review" | "hsk";

export type HanziHistory = {
  ch: string;
  pinyin: string | null;
  meaning: string | null;
  /** Нийт бичсэн удаа (дагаж + санаж). */
  writes: number;
  /** Нийт алдсан зураас. */
  mistakes: number;
  /** Харахгүйгээр санаж зөв бичсэн удаа. */
  recallOk: number;
  /** Санаж бичихэд чадаагүй удаа (сануулга авсан эсвэл 3+ алдсан). */
  recallFail: number;
  /** Санаж зөв бичсэн ӨӨР өдрүүд (YYYY-MM-DD, эрэмбэлсэн, сүүлийн 12). */
  recallDays: string[];
  /** Хамгийн сүүлийн санаж бичилт чадсан уу (null = хараахан санаж бичээгүй). */
  lastRecallOk: boolean | null;
  bySource: Record<HanziSource, number>;
  /** Сурагч өөрөө «Давталтад нэмэх» гэж зөвшөөрсөн. */
  inReview: boolean;
  /** Энэ ханзыг ямар холбоо үгэн дотор бичсэн (утсан дээр л хадгална) — дахин бичихэд хамтад нь бичүүлнэ. */
  word?: string | null;
  wordPinyin?: string | null;
  wordMeaning?: string | null;
  firstAt: string;
  lastAt: string;
  updatedAt: string;
};

export type HanziHistoryMap = Record<string, HanziHistory>;

type Store = { items: HanziHistoryMap; dirty: string[] };

const HAN_RE = /\p{Script=Han}/u;
const MAX_DAYS = 12;

/** Сэргээх завсар (хоног): 1 дэх зөв санасны дараа маргааш, дараа нь 3, 7, 21. */
export const REFRESH_INTERVALS = [1, 3, 7, 21];

function emptyStore(): Store {
  return { items: {}, dirty: [] };
}

function readStore(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(HANZI_HISTORY_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      items: parsed?.items && typeof parsed.items === "object" ? parsed.items : {},
      dirty: Array.isArray(parsed?.dirty) ? parsed.dirty : [],
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store, notify = true) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HANZI_HISTORY_KEY, JSON.stringify(store));
  } catch {
    // Storage дүүрсэн — чимээгүй үргэлжилнэ.
  }
  if (notify) {
    try {
      window.dispatchEvent(new Event(HANZI_HISTORY_EVENT));
    } catch {
      // ignore
    }
  }
}

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayToMs(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
}

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((dayToMs(toDay) - dayToMs(fromDay)) / 86_400_000);
}

function blank(ch: string, now: string): HanziHistory {
  return {
    ch,
    pinyin: null,
    meaning: null,
    writes: 0,
    mistakes: 0,
    recallOk: 0,
    recallFail: 0,
    recallDays: [],
    lastRecallOk: null,
    bySource: { book: 0, review: 0, hsk: 0 },
    inReview: false,
    firstAt: now,
    lastAt: now,
    updatedAt: now,
  };
}

function normalize(raw: Partial<HanziHistory> & { ch: string }): HanziHistory {
  const now = new Date().toISOString();
  const base = blank(raw.ch, raw.firstAt ?? now);
  const src = (raw.bySource ?? {}) as Partial<Record<HanziSource, number>>;
  return {
    ...base,
    ...raw,
    writes: Math.max(0, Number(raw.writes) || 0),
    mistakes: Math.max(0, Number(raw.mistakes) || 0),
    recallOk: Math.max(0, Number(raw.recallOk) || 0),
    recallFail: Math.max(0, Number(raw.recallFail) || 0),
    recallDays: Array.isArray(raw.recallDays)
      ? [...new Set(raw.recallDays.filter((d) => typeof d === "string"))].sort().slice(-MAX_DAYS)
      : [],
    lastRecallOk: typeof raw.lastRecallOk === "boolean" ? raw.lastRecallOk : null,
    bySource: {
      book: Number(src.book) || 0,
      review: Number(src.review) || 0,
      hsk: Number(src.hsk) || 0,
    },
    inReview: Boolean(raw.inReview),
    lastAt: raw.lastAt ?? base.lastAt,
    updatedAt: raw.updatedAt ?? base.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Унших                                                              */
/* ------------------------------------------------------------------ */

export function getHanziHistoryMap(): HanziHistoryMap {
  const { items } = readStore();
  const out: HanziHistoryMap = {};
  for (const [ch, row] of Object.entries(items)) out[ch] = normalize({ ...row, ch });
  return out;
}

export function getHanziHistory(ch: string): HanziHistory | null {
  const row = readStore().items[ch];
  return row ? normalize({ ...row, ch }) : null;
}

export function getReviewHanzi(): HanziHistory[] {
  return Object.values(getHanziHistoryMap()).filter((h) => h.inReview);
}

/* ------------------------------------------------------------------ */
/* Шат (шинжлэх ухааны үндэс: сэргээн санах + завсартай давталт)       */
/* ------------------------------------------------------------------ */

/**
 * new      — зөвхөн дагаж зурсан, хараахан санаж бичээгүй
 * weak     — хамгийн сүүлийн санаж бичилт чадаагүй
 * learning — нэг өдөр санаж зөв бичсэн (маргааш мартсан байж магадгүй)
 * learned  — ХОЁР ӨӨР өдөр санаж зөв бичсэн = «сурсан»
 * solid    — 7+ хоногийн завсартайгаар дахин зөв санасан = «бат тогтсон»
 */
export type HanziStage = "new" | "weak" | "learning" | "learned" | "solid";

export function hanziStage(h: HanziHistory): HanziStage {
  if (h.lastRecallOk === false) return "weak";
  const days = h.recallDays;
  if (days.length === 0) return "new";
  for (let i = 1; i < days.length; i += 1) {
    if (daysBetween(days[i - 1]!, days[i]!) >= 7) return "solid";
  }
  return days.length >= 2 ? "learned" : "learning";
}

export function isLearned(h: HanziHistory): boolean {
  const s = hanziStage(h);
  return s === "learned" || s === "solid";
}

/** Дараагийн сэргээх өдөр (YYYY-MM-DD). Санаж зөв бичээгүй бол null. */
export function nextRefreshDay(h: HanziHistory): string | null {
  const days = h.recallDays;
  if (days.length === 0) return null;
  const last = days[days.length - 1]!;
  const gap = REFRESH_INTERVALS[Math.min(days.length - 1, REFRESH_INTERVALS.length - 1)]!;
  return dayKey(new Date(dayToMs(last) + gap * 86_400_000));
}

/** Өнөөдөр сэргээх хугацаа нь болсон уу (бат тогтсоныг оруулахгүй). */
export function isRefreshDue(h: HanziHistory, today: string = dayKey()): boolean {
  if (hanziStage(h) === "solid") return false;
  const next = nextRefreshDay(h);
  return next != null && next <= today;
}

export type HanziDashboard = {
  total: number;
  learned: number;
  weak: HanziHistory[];
  /** Өнөөдөр бичих: сул ханз эхэндээ, дараа нь сэргээх хугацаа болсон нь. */
  today: HanziHistory[];
  todayWeak: number;
  todayRefresh: number;
  all: HanziHistory[];
};

export const TODAY_LIMIT = 12;

export function buildHanziDashboard(map: HanziHistoryMap = getHanziHistoryMap()): HanziDashboard {
  const today = dayKey();
  // Давталтад нэмсэн холбоо үг мөн энд хадгалагддаг (inReview) — тоолол нь зөвхөн ганц ханзаар.
  const all = Object.values(map)
    .filter((h) => [...h.ch].length === 1 && h.writes > 0)
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  const weak = all
    .filter((h) => hanziStage(h) === "weak")
    .sort((a, b) => b.mistakes - a.mistakes);
  const refresh = all
    .filter((h) => hanziStage(h) !== "weak" && isRefreshDue(h, today))
    .sort((a, b) => ((nextRefreshDay(a) ?? "") < (nextRefreshDay(b) ?? "") ? -1 : 1));
  const todayList = [...weak, ...refresh].slice(0, TODAY_LIMIT);
  const todayWeak = Math.min(weak.length, TODAY_LIMIT);
  return {
    total: all.length,
    learned: all.filter(isLearned).length,
    weak,
    today: todayList,
    todayWeak,
    todayRefresh: todayList.length - todayWeak,
    all,
  };
}

/* ------------------------------------------------------------------ */
/* Бичих                                                              */
/* ------------------------------------------------------------------ */

export type HanziWriteInput = {
  ch: string;
  source: HanziSource;
  mistakes: number;
  /** true/false = санаж бичилтийн дүн; null = дагаж зурсан (санаж бичээгүй). */
  recalled: boolean | null;
  pinyin?: string | null;
  meaning?: string | null;
  /** Холбоо үгэн дотор бичсэн бол тэр үг, түүний пиньинь, утга. */
  word?: string | null;
  wordPinyin?: string | null;
  wordMeaning?: string | null;
};

/** Сануулга авсан эсвэл 3+ алдсан бол санаж чадаагүйд тооцно (дэвтрийн дүрэмтэй ижил). */
export function recallSucceeded(result: { mistakes: number; usedHint: boolean }): boolean {
  return !result.usedHint && result.mistakes < 3;
}

export function recordHanziWrite(input: HanziWriteInput): void {
  const ch = (input.ch ?? "").trim();
  if (!ch || !HAN_RE.test(ch) || [...ch].length !== 1) return;
  const store = readStore();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const prev = store.items[ch] ? normalize({ ...store.items[ch]!, ch }) : blank(ch, now);
  const next: HanziHistory = {
    ...prev,
    pinyin: prev.pinyin ?? input.pinyin ?? null,
    meaning: prev.meaning ?? input.meaning ?? null,
    writes: prev.writes + 1,
    mistakes: prev.mistakes + Math.max(0, Math.round(input.mistakes) || 0),
    bySource: { ...prev.bySource, [input.source]: prev.bySource[input.source] + 1 },
    lastAt: now,
    updatedAt: now,
  };
  if (input.word && [...input.word].length > 1) {
    next.word = input.word;
    next.wordPinyin = input.wordPinyin ?? null;
    next.wordMeaning = input.wordMeaning ?? null;
  }
  if (input.recalled === true) {
    next.recallOk += 1;
    next.lastRecallOk = true;
    next.recallDays = [...new Set([...prev.recallDays, dayKey(nowDate)])].sort().slice(-MAX_DAYS);
  } else if (input.recalled === false) {
    next.recallFail += 1;
    next.lastRecallOk = false;
  }
  store.items[ch] = next;
  if (!store.dirty.includes(ch)) store.dirty.push(ch);
  writeStore(store);
  schedulePush();
}

/** Үг (олон ханзтай байж болно) бичсэн дүнг ханз тус бүрд хуваарилж бүртгэнэ. */
export function recordWordWrite(
  word: string,
  source: HanziSource,
  result: { mistakes: number; usedHint: boolean },
  meta?: { pinyin?: string | null; meaning?: string | null }
): void {
  const chars = [...(word ?? "")].filter((c) => HAN_RE.test(c));
  if (chars.length === 0) return;
  const single = chars.length === 1;
  const ok = recallSucceeded(result);
  const share = Math.round(result.mistakes / chars.length);
  for (const ch of chars) {
    recordHanziWrite({
      ch,
      source,
      mistakes: share,
      recalled: ok,
      pinyin: single ? meta?.pinyin ?? null : null,
      meaning: single ? meta?.meaning ?? null : null,
    });
  }
}

/**
 * Сурагчийн ЗӨВШӨӨРЛӨӨР ханзыг Давтах → Бичих хуваарьт нэмэх / хасах.
 * Зөвхөн хэрэглэгч товч дарахад дуудна.
 */
export function setHanziInReview(
  chars: string[],
  inReview: boolean,
  metaByCh?: Record<string, { pinyin?: string | null; meaning?: string | null }>
): void {
  const store = readStore();
  const now = new Date().toISOString();
  for (const raw of chars) {
    const ch = (raw ?? "").trim();
    if (!ch || !HAN_RE.test(ch)) continue;
    const prev = store.items[ch] ? normalize({ ...store.items[ch]!, ch }) : blank(ch, now);
    const meta = metaByCh?.[ch];
    store.items[ch] = {
      ...prev,
      pinyin: prev.pinyin ?? meta?.pinyin ?? null,
      meaning: prev.meaning ?? meta?.meaning ?? null,
      inReview,
      updatedAt: now,
    };
    if (!store.dirty.includes(ch)) store.dirty.push(ch);
  }
  writeStore(store);
  schedulePush();
}

/* ------------------------------------------------------------------ */
/* Сервер (Supabase) — байхгүй/алдаатай бол чимээгүй алгасна           */
/* ------------------------------------------------------------------ */

const TABLE = "user_hanzi_history";
let serverOff = false;
let pushTimer: number | null = null;
let userIdCache: string | null | undefined;

async function resolveUserId(): Promise<string | null> {
  if (!hasSupabaseConfig || !supabase || serverOff) return null;
  if (userIdCache !== undefined) return userIdCache;
  try {
    const { userId } = await getAuthenticatedUserId();
    userIdCache = userId ?? null;
  } catch {
    userIdCache = null;
  }
  return userIdCache;
}

type DbRow = {
  ch: string;
  pinyin: string | null;
  meaning_mn: string | null;
  writes: number;
  mistakes: number;
  recall_ok: number;
  recall_fail: number;
  recall_days: string[] | null;
  last_recall_ok: boolean | null;
  by_source: Partial<Record<HanziSource, number>> | null;
  in_review: boolean;
  first_at: string;
  last_at: string;
  updated_at: string;
};

function toDb(userId: string, h: HanziHistory): DbRow & { user_id: string } {
  return {
    user_id: userId,
    ch: h.ch,
    pinyin: h.pinyin,
    meaning_mn: h.meaning,
    writes: h.writes,
    mistakes: h.mistakes,
    recall_ok: h.recallOk,
    recall_fail: h.recallFail,
    recall_days: h.recallDays,
    last_recall_ok: h.lastRecallOk,
    by_source: h.bySource,
    in_review: h.inReview,
    first_at: h.firstAt,
    last_at: h.lastAt,
    updated_at: h.updatedAt,
  };
}

function fromDb(row: DbRow): HanziHistory {
  return normalize({
    ch: row.ch,
    pinyin: row.pinyin,
    meaning: row.meaning_mn,
    writes: row.writes,
    mistakes: row.mistakes,
    recallOk: row.recall_ok,
    recallFail: row.recall_fail,
    recallDays: row.recall_days ?? [],
    lastRecallOk: row.last_recall_ok,
    bySource: (row.by_source ?? {}) as Record<HanziSource, number>,
    inReview: row.in_review,
    firstAt: row.first_at,
    lastAt: row.last_at,
    updatedAt: row.updated_at,
  });
}

function schedulePush() {
  if (typeof window === "undefined" || serverOff || !hasSupabaseConfig) return;
  if (pushTimer != null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void pushDirty();
  }, 2500);
}

async function pushDirty(): Promise<void> {
  const userId = await resolveUserId();
  if (!userId || !supabase) return;
  const store = readStore();
  const chars = store.dirty.filter((ch) => store.items[ch]);
  if (chars.length === 0) return;
  try {
    const rows = chars.map((ch) => toDb(userId, normalize({ ...store.items[ch]!, ch })));
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: "user_id,ch" });
    if (error) {
      // Хүснэгт хараахан үүсээгүй (SQL ажиллаагүй) эсвэл эрхгүй — энэ удаадаа дахин оролдохгүй.
      serverOff = true;
      return;
    }
    const after = readStore();
    after.dirty = after.dirty.filter((ch) => !chars.includes(ch));
    writeStore(after, false);
  } catch {
    // офлайн — дараа дахин оролдоно
  }
}

/**
 * Серверийн түүхийг татаж утсан дээрхтэй нэгтгэнэ (шинэ `updatedAt` нь ялна),
 * дараа нь утсан дээрх шинэ мөрүүдийг сервер рүү илгээнэ. Алдаа гарвал чимээгүй.
 */
export async function syncHanziHistory(): Promise<void> {
  const userId = await resolveUserId();
  if (!userId || !supabase) return;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select(
        "ch, pinyin, meaning_mn, writes, mistakes, recall_ok, recall_fail, recall_days, last_recall_ok, by_source, in_review, first_at, last_at, updated_at"
      )
      .eq("user_id", userId)
      .limit(5000);
    if (error) {
      serverOff = true;
      return;
    }
    const store = readStore();
    const seen = new Set<string>();
    let changed = false;
    for (const raw of (data ?? []) as DbRow[]) {
      const server = fromDb(raw);
      seen.add(server.ch);
      const local = store.items[server.ch];
      if (!local || (local.updatedAt ?? "") < server.updatedAt) {
        store.items[server.ch] = local
          ? { ...server, word: local.word, wordPinyin: local.wordPinyin, wordMeaning: local.wordMeaning }
          : server;
        store.dirty = store.dirty.filter((c) => c !== server.ch);
        changed = true;
      } else if ((local.updatedAt ?? "") > server.updatedAt && !store.dirty.includes(server.ch)) {
        store.dirty.push(server.ch);
      }
    }
    // Сервер дээр огт байхгүй (зочноор бичсэн г.м.) мөрүүдийг илгээнэ.
    for (const ch of Object.keys(store.items)) {
      if (!seen.has(ch) && !store.dirty.includes(ch)) store.dirty.push(ch);
    }
    writeStore(store, changed);
    await pushDirty();
  } catch {
    // офлайн
  }
}
