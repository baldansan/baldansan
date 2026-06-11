import {
  activeLevelToCatalogLevel,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";
import { buildLocalQueue } from "@/lib/srs/local-word-srs";
import { fetchHskWordsByLevel } from "@/lib/supabase/hsk-words";
import { getAuthenticatedUserId, hasSupabaseConfig } from "@/lib/supabase/auth";
import { fetchBichlegHskWordIds } from "@/lib/supabase/saved-words";
import { getDueWordQueue } from "@/lib/supabase/user-word-srs";
import { supabase } from "@/lib/supabase/client";

export type GameWordSource = "srs" | "saved" | "catalog";

export const GAME_WORD_POOL_MIN = 8;

export type GameWordPoolResult = {
  wordIds: number[];
  toppedUp: boolean;
  note: string | null;
};

export const GAME_WORD_SOURCE_OPTIONS: {
  id: GameWordSource;
  emoji: string;
  title: string;
  desc: string;
  requiresAuth?: boolean;
}[] = [
  {
    id: "srs",
    emoji: "🔥",
    title: "Миний давталтын үгс",
    desc: "Due + сүүлд алдсан үгс",
    requiresAuth: true,
  },
  {
    id: "saved",
    emoji: "▶",
    title: "Бичлэгээс хадгалсан",
    desc: "Бичлэг дээр хадгалсан үгс",
    requiresAuth: true,
  },
  {
    id: "catalog",
    emoji: "📊",
    title: "HSK түвшнээр",
    desc: "Сонгосон HSK түвшний каталог",
  },
];

export function defaultGameWordSource(isLoggedIn: boolean): GameWordSource {
  return isLoggedIn ? "srs" : "catalog";
}

async function fetchFailedSrsWordIds(
  userId: string,
  catalogLevel: string,
  limit = 24
): Promise<number[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_word_srs")
    .select("word_id")
    .eq("user_id", userId)
    .in("last_rating", ["forgot", "hard"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];

  const ids = data.map((r) => r.word_id as number).filter(Boolean);
  if (!ids.length) return [];

  const { data: words } = await supabase
    .from("hsk_words")
    .select("id")
    .in("id", ids)
    .eq("hsk_level", catalogLevel)
    .eq("is_function_word", false);

  const allowed = new Set((words ?? []).map((w) => w.id as number));
  return ids.filter((id) => allowed.has(id));
}

async function fetchCatalogWordIds(
  activeLevel: ActiveHskLevel,
  exclude: Set<number>,
  need: number
): Promise<number[]> {
  const { data: words } = await fetchHskWordsByLevel(activeLevel, { limit: 160 });
  const pool = (words ?? []).filter((w) => w.id != null && !exclude.has(w.id));
  const local = buildLocalQueue(pool, activeLevel, need + exclude.size);
  const ids = local.map((i) => i.word.id!).filter(Boolean);
  if (ids.length >= need) return ids.slice(0, need);

  return pool
    .map((w) => w.id!)
    .filter((id) => !exclude.has(id))
    .slice(0, need);
}

export async function buildGameWordPool(
  source: GameWordSource,
  activeLevel: ActiveHskLevel
): Promise<GameWordPoolResult> {
  const catalogLevel = activeLevelToCatalogLevel(activeLevel);
  let ids: number[] = [];
  let toppedUp = false;

  if (source === "srs" && hasSupabaseConfig && supabase) {
    const { userId } = await getAuthenticatedUserId();
    if (userId) {
      const [{ items }, failed] = await Promise.all([
        getDueWordQueue(userId, activeLevel, 30),
        fetchFailedSrsWordIds(userId, catalogLevel),
      ]);
      const merged = [...items.map((i) => i.word.id!).filter(Boolean), ...failed];
      ids = [...new Set(merged)];
    }
  }

  if (source === "saved" && hasSupabaseConfig && supabase) {
    const { userId } = await getAuthenticatedUserId();
    if (userId) {
      const saved = await fetchBichlegHskWordIds(userId);
      ids = [...saved];
    }
  }

  if (source === "catalog" || ids.length === 0) {
    if (source === "catalog") ids = [];
    const { data: words } = await fetchHskWordsByLevel(activeLevel, { limit: 120 });
    const local = buildLocalQueue(words ?? [], activeLevel, 40);
    ids =
      source === "catalog"
        ? local.map((i) => i.word.id!).filter(Boolean)
        : ids.length > 0
          ? ids
          : local.map((i) => i.word.id!).filter(Boolean);
  }

  ids = await filterEligibleWordIds(ids);

  if (ids.length < GAME_WORD_POOL_MIN) {
    const exclude = new Set(ids);
    const filler = await fetchCatalogWordIds(
      activeLevel,
      exclude,
      GAME_WORD_POOL_MIN - ids.length
    );
    if (filler.length > 0) {
      ids = [...ids, ...filler];
      toppedUp = true;
    }
  }

  return {
    wordIds: [...new Set(ids)],
    toppedUp,
    note: toppedUp
      ? "Цөөн үгтэй тул түвшний үгээр нөхөв"
      : null,
  };
}

async function filterEligibleWordIds(ids: number[]): Promise<number[]> {
  if (!ids.length || !supabase) return ids;
  const unique = [...new Set(ids)];
  const allowed: number[] = [];
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    const { data } = await supabase
      .from("hsk_words")
      .select("id")
      .in("id", chunk)
      .eq("is_function_word", false);
    for (const row of data ?? []) {
      if (row.id != null) allowed.push(row.id as number);
    }
  }
  const allowedSet = new Set(allowed);
  return unique.filter((id) => allowedSet.has(id));
}

export function wordIdsToQuery(wordIds: number[]): string {
  if (!wordIds.length) return "";
  return `&wordIds=${encodeURIComponent(wordIds.join(","))}`;
}
