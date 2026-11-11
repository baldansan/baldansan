import type { MockTestQuestionRow } from "@/lib/mock-test/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import { fetchMockTestQuestionsByIds } from "@/lib/supabase/mock-tests-server";
export { PLACEMENT_BLOCK, PLACEMENT_BLOCKS, PLACEMENT_MINUTES, PLACEMENT_TOTAL } from "@/lib/placement/constants";

/**
 * Түвшин тогтоох шалгалт (placement) — HSK 1–6 түвшин бүрээс компьютер шалгаж
 * чадах (autograde auto) сонсгол + унших асуултуудаас санамсаргүй багц. Клиент
 * 5 асуултын блокоор дасан зохицож (adaptive) явна: ≥4 зөв → түвшин ахина,
 * ≤1 → буурна. Нийт 30 асуулт, 20 минут.
 */

/** Нэг түвшинд дээд тал нь 3 блок (15 асуулт) орох боломжтой → 15 асуулт/түвшин. */
const PER_LEVEL = 15;

/** Хурдан хариулагддаг, зураг/аудио бүлэглэх шаардлагагүй төрлүүд. */
const OK_TYPES = new Set(["choice", "judge", "fill_word", "fill_match", "match", "order"]);

type Candidate = { id: string; test_id: string; skill: string; q_type: string };

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

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Түвшин бүрт сонсгол/унших тэнцүү орцтой, нэг тестээс ≤3 асуулттай сонголт.
 * Сонсголын асуулт заавал аудио цагтай (audio_start_sec) байх.
 */
function pickForLevel(cands: Candidate[], rnd: () => number, n: number): Candidate[] {
  const listening = shuffle(cands.filter((c) => c.skill === "listening"), rnd);
  const reading = shuffle(cands.filter((c) => c.skill === "reading"), rnd);
  const perTest = new Map<string, number>();
  const out: Candidate[] = [];
  const take = (pool: Candidate[], want: number) => {
    let got = 0;
    for (const c of pool) {
      if (got >= want) break;
      const used = perTest.get(c.test_id) ?? 0;
      if (used >= 3) continue;
      perTest.set(c.test_id, used + 1);
      out.push(c);
      got++;
    }
    return got;
  };
  const half = Math.ceil(n / 2);
  const gotL = take(listening, half);
  take(reading, n - gotL);
  if (out.length < n) take(listening.filter((c) => !out.includes(c)), n - out.length);
  // Сонсгол/унших ээлжилж явна.
  const L = out.filter((c) => c.skill === "listening");
  const R = out.filter((c) => c.skill !== "listening");
  const mixed: Candidate[] = [];
  while (L.length || R.length) {
    if (L.length) mixed.push(L.shift()!);
    if (R.length) mixed.push(R.shift()!);
  }
  return mixed;
}

export type PlacementPool = {
  salt: string;
  /** level → асуултууд (дарааллаар ашиглана) */
  byLevel: Record<number, MockTestQuestionRow[]>;
};

export async function fetchPlacementPool(salt: string): Promise<PlacementPool | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  let { data: tests, error: tErr } = await client
    .from("mock_tests")
    .select("id, hsk_level")
    .eq("is_active", true);
  if (tErr && /is_active/.test(tErr.message)) {
    ({ data: tests, error: tErr } = await client.from("mock_tests").select("id, hsk_level"));
  }
  if (tErr || !tests?.length) return null;
  const levelOfTest = new Map<string, number>();
  for (const t of tests as { id: string; hsk_level: number }[]) levelOfTest.set(String(t.id), Number(t.hsk_level));

  const { data: rows, error } = await client
    .from("mock_test_questions")
    .select("id, test_id, skill, q_type, audio_start_sec, audio_url")
    .in("test_id", [...levelOfTest.keys()])
    .eq("autograde", "auto")
    .in("skill", ["listening", "reading"]);
  if (error || !rows?.length) return null;

  const byLevelCands = new Map<number, Candidate[]>();
  for (const r of rows as {
    id: string;
    test_id: string;
    skill: string;
    q_type: string;
    audio_start_sec: number | null;
    audio_url: string | null;
  }[]) {
    if (!OK_TYPES.has(r.q_type)) continue;
    if (r.skill === "listening" && (r.audio_start_sec == null || !r.audio_url)) continue;
    const lvl = levelOfTest.get(String(r.test_id));
    if (!lvl) continue;
    const arr = byLevelCands.get(lvl) ?? [];
    arr.push({ id: String(r.id), test_id: String(r.test_id), skill: r.skill, q_type: r.q_type });
    byLevelCands.set(lvl, arr);
  }

  const rnd = seededRandom(hashString(`placement|${salt}`));
  const picked = new Map<number, Candidate[]>();
  const allIds: string[] = [];
  for (let lvl = 1; lvl <= 6; lvl++) {
    const sel = pickForLevel(byLevelCands.get(lvl) ?? [], rnd, PER_LEVEL);
    picked.set(lvl, sel);
    allIds.push(...sel.map((c) => c.id));
  }
  if (!allIds.length) return null;

  const full = await fetchMockTestQuestionsByIds(allIds);
  const byId = new Map(full.map((q) => [q.id, q]));
  const byLevel: Record<number, MockTestQuestionRow[]> = {};
  for (const [lvl, sel] of picked) {
    byLevel[lvl] = sel
      .map((c) => byId.get(c.id))
      .filter((q): q is MockTestQuestionRow => Boolean(q));
  }
  return { salt, byLevel };
}
