import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import { fetchMockTestQuestionsByIds } from "@/lib/supabase/mock-tests-server";

/**
 * «Өнөөдрийн сонсгол» — жинхэнэ шалгалтуудын (真题) сонсголын асуултуудаас
 * тухайн түвшинд санамсаргүй N асуулт. Өдөр бүр ижил хэрэглэгчид ижил багц
 * (огноо + түвшин + salt-аар seed) — «өнөөдрийнхөө 10-ыг хийлээ» гэсэн
 * мэдрэмж өгнө; «Дахин 10» дарвал salt өөрчлөгдөж шинэ багц гарна.
 *
 * Зөвхөн аудио цагтай (audio_start_sec) асуултуудыг авна — ингэснээр асуулт
 * бүр өөрийн 20–40 секундын хэсгээ тоглуулна.
 */

export const DAILY_LISTENING_COUNT = 10;

type Candidate = { id: string; test_id: string; q_no: number };

/** Тогтвортой seed → 0..1 (mulberry32). */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Улаанбаатарын (UTC+8) өнөөдрийн огноо — YYYY-MM-DD. */
export function ulaanbaatarDateKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 8 * 3600 * 1000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Нэг тестээс хэт олон асуулт орохгүйгээр (max 2) seed-ээр сонгоно.
 * Олон асуулттай нэг бичвэр (31–45 г.м.) давтагдаж болох тул тест+q_no
 * хослол давхардахгүй байхыг л шалгана.
 */
function pickSeeded(candidates: Candidate[], seed: number, n: number): Candidate[] {
  const rnd = seededRandom(seed);
  const pool = [...candidates];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const perTest = new Map<string, number>();
  const picked: Candidate[] = [];
  for (const c of pool) {
    const used = perTest.get(c.test_id) ?? 0;
    if (used >= 2) continue;
    perTest.set(c.test_id, used + 1);
    picked.push(c);
    if (picked.length >= n) break;
  }
  // Тест цөөн бол (HSK3) хязгаарыг сулруулж дүүргэнэ.
  if (picked.length < n) {
    for (const c of pool) {
      if (picked.includes(c)) continue;
      picked.push(c);
      if (picked.length >= n) break;
    }
  }
  return picked;
}

export type DailyListeningSet = {
  level: number;
  dateKey: string;
  salt: string;
  questions: MockTestQuestionRow[];
  /** Хэдэн тестээс бүрдсэн (мэдээллийн зорилгоор) */
  testCount: number;
};

export async function fetchDailyListeningSet(opts: {
  level: number;
  salt?: string;
  count?: number;
  dateKey?: string;
}): Promise<DailyListeningSet | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const level = Math.min(6, Math.max(1, Math.round(opts.level)));
  const count = opts.count ?? DAILY_LISTENING_COUNT;
  const dateKey = opts.dateKey ?? ulaanbaatarDateKey();
  const salt = opts.salt ?? "";

  let { data: tests, error: tErr } = await client
    .from("mock_tests")
    .select("id")
    .eq("hsk_level", level)
    .eq("is_active", true);
  if (tErr && /is_active/.test(tErr.message)) {
    // 084 migration ажиллаагүй бол шүүлтгүй.
    ({ data: tests, error: tErr } = await client.from("mock_tests").select("id").eq("hsk_level", level));
  }
  if (tErr || !tests?.length) return null;
  const testIds = tests.map((t) => String(t.id));

  const { data: rows, error } = await client
    .from("mock_test_questions")
    .select("id, test_id, q_no")
    .in("test_id", testIds)
    .eq("skill", "listening")
    .not("audio_start_sec", "is", null)
    .not("audio_url", "is", null);
  if (error || !rows?.length) return null;

  const candidates: Candidate[] = rows.map((r) => ({
    id: String(r.id),
    test_id: String(r.test_id),
    q_no: Number(r.q_no),
  }));

  const seed = hashString(`${dateKey}|${level}|${salt}`);
  const picked = pickSeeded(candidates, seed, count);
  if (!picked.length) return null;

  const full = await fetchMockTestQuestionsByIds(picked.map((p) => p.id));
  // Сонгосон дарааллаар (seed-ийн дагуу) буцаана.
  const byId = new Map(full.map((q) => [q.id, q]));
  const ordered = picked
    .map((p) => byId.get(p.id))
    .filter((q): q is MockTestQuestionRow => Boolean(q));

  return {
    level,
    dateKey,
    salt,
    questions: ordered,
    testCount: new Set(ordered.map((q) => q.test_id)).size,
  };
}
