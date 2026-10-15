import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import type { PointsPeriod, PointsSource } from "@/lib/points/points-config";

export type PointsSummary = {
  total: number;
  last7d: number;
  prev7d: number;
  last30d: number;
  bySource: Partial<Record<PointsSource, number>>;
};

export type RankRow = {
  userId: string;
  displayName: string;
  points: number;
  rank: number;
  isMe: boolean;
  isDemo: boolean;
};

export type MyRank = {
  scope: "class" | "organization" | "global";
  scopeId: string | null;
  scopeName: string;
  points: number;
  rank: number;
  participants: number;
};

export type BestStudent = {
  userId: string;
  displayName: string;
  avatar: string | null;
  instagram: string | null;
  levelLabel: string | null;
  points: number;
  rank: number;
};

export type ClassPointsRow = {
  classroomId: string;
  classroomName: string;
  students: number;
  activeStudents: number;
  totalPoints: number;
  avgPoints: number;
  rank: number;
};

type Row = Record<string, unknown>;

function mapRank(r: Row): RankRow {
  return {
    userId: String(r.user_id),
    displayName: String(r.display_name ?? "Сурагч"),
    points: Number(r.points ?? 0),
    rank: Number(r.rank ?? 0),
    isMe: Boolean(r.is_me),
    isDemo: Boolean(r.is_demo),
  };
}

function mapSummary(data: Row): PointsSummary {
  return {
    total: Number(data.total ?? 0),
    last7d: Number(data.last_7d ?? 0),
    prev7d: Number(data.prev_7d ?? 0),
    last30d: Number(data.last_30d ?? 0),
    bySource: (data.by_source ?? {}) as PointsSummary["bySource"],
  };
}

const EMPTY_SUMMARY: PointsSummary = {
  total: 0,
  last7d: 0,
  prev7d: 0,
  last30d: 0,
  bySource: {},
};

/** Өөрийн нийт оноо (live 7/30 хоногтой). Нэвтрээгүй бол null. */
export async function fetchMyPoints(): Promise<PointsSummary | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_points_summary")
    .select("total, last_7d, prev_7d, last_30d, by_source")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[points] summary fetch failed:", error.message);
    return null;
  }
  return data ? mapSummary(data as Row) : EMPTY_SUMMARY;
}

/** Тодорхой сурагчийн оноо (багш / админ — RLS шалгана). */
export async function fetchUserPoints(
  userId: string
): Promise<PointsSummary | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { data } = await supabase
    .from("user_points_summary")
    .select("total, last_7d, prev_7d, last_30d, by_source")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapSummary(data as Row) : null;
}

async function rpcRows(
  name: string,
  args: Record<string, unknown>
): Promise<Row[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    console.warn(`[points] ${name} failed:`, error.message);
    return [];
  }
  return (data ?? []) as Row[];
}

export async function fetchRankClass(
  classroomId: string,
  period: PointsPeriod
): Promise<RankRow[]> {
  return (
    await rpcRows("rank_class", { p_classroom_id: classroomId, p_period: period })
  ).map(mapRank);
}

export async function fetchRankOrganization(
  orgId: string,
  period: PointsPeriod
): Promise<RankRow[]> {
  return (
    await rpcRows("rank_organization", { p_org_id: orgId, p_period: period })
  ).map(mapRank);
}

export async function fetchRankGlobal(
  period: PointsPeriod,
  limit = 50,
  includeDemo = false
): Promise<RankRow[]> {
  return (
    await rpcRows("rank_global", {
      p_period: period,
      p_limit: limit,
      p_include_demo: includeDemo,
    })
  ).map(mapRank);
}

export async function fetchMyRanks(period: PointsPeriod): Promise<MyRank[]> {
  return (await rpcRows("my_rank_summary", { p_period: period })).map((r) => ({
    scope: String(r.scope) as MyRank["scope"],
    scopeId: r.scope_id ? String(r.scope_id) : null,
    scopeName: String(r.scope_name ?? ""),
    points: Number(r.points ?? 0),
    rank: Number(r.rank ?? 0),
    participants: Number(r.participants ?? 0),
  }));
}

export async function fetchBestStudents(
  period: PointsPeriod,
  limit = 10
): Promise<BestStudent[]> {
  return (
    await rpcRows("best_students", { p_period: period, p_limit: limit })
  ).map((r) => ({
    userId: String(r.user_id),
    displayName: String(r.display_name ?? "Сурагч"),
    avatar: (r.avatar as string | null) ?? null,
    instagram: (r.instagram as string | null) ?? null,
    levelLabel: (r.level_label as string | null) ?? null,
    points: Number(r.points ?? 0),
    rank: Number(r.rank ?? 0),
  }));
}

export async function fetchClassPointsSummary(
  orgId: string,
  period: PointsPeriod = "all"
): Promise<ClassPointsRow[]> {
  return (
    await rpcRows("class_points_summary", { p_org_id: orgId, p_period: period })
  ).map((r) => ({
    classroomId: String(r.classroom_id),
    classroomName: String(r.classroom_name ?? ""),
    students: Number(r.students ?? 0),
    activeStudents: Number(r.active_students ?? 0),
    totalPoints: Number(r.total_points ?? 0),
    avgPoints: Number(r.avg_points ?? 0),
    rank: Number(r.rank ?? 0),
  }));
}

/** Серверийн points_today()-той ижил: Улаанбаатарын цагаар өнөөдрийн огноо (YYYY-MM-DD). */
export function pointsTodayKey(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ulaanbaatar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Өнөөдөр цуглуулсан оноо (user_points_daily). Нэвтрээгүй бол null. */
export async function fetchMyPointsToday(): Promise<number | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("user_points_daily")
    .select("points")
    .eq("user_id", userId)
    .eq("day", pointsTodayKey())
    .maybeSingle();
  if (error) {
    console.warn("[points] today fetch failed:", error.message);
    return null;
  }
  return Number(data?.points ?? 0);
}

/** Ангийн зэрэглэл (my_rank_summary → scope=class). Ангигүй / RPC байхгүй бол null. */
export async function fetchMyClassRank(): Promise<MyRank | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;
  const ranks = await fetchMyRanks("all");
  return ranks.find((r) => r.scope === "class" && r.rank > 0) ?? null;
}

/** "Та эхний 15%-д" — rank/participants-аас. */
export function topPercent(rank: number, participants: number): number {
  if (participants <= 0 || rank <= 0) return 100;
  return Math.max(1, Math.ceil((rank / participants) * 100));
}

/** Нийтэд харагдах профайл (is_public) хадгалах / унших. */
export type PublicProfile = {
  displayName: string;
  avatar: string;
  instagram: string;
  levelLabel: string;
  isPublic: boolean;
};

export async function fetchMyPublicProfile(): Promise<PublicProfile | null> {
  if (!hasSupabaseConfig || !supabase) return null;
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("user_public_profile")
    .select("display_name, avatar, instagram, level_label, is_public")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    displayName: String(data?.display_name ?? ""),
    avatar: String(data?.avatar ?? ""),
    instagram: String(data?.instagram ?? ""),
    levelLabel: String(data?.level_label ?? ""),
    isPublic: Boolean(data?.is_public),
  };
}

export async function saveMyPublicProfile(
  p: PublicProfile
): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabaseConfig || !supabase) return { ok: false, error: "Тохиргоо байхгүй" };
  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "Нэвтрээгүй" };
  const { error } = await supabase.from("user_public_profile").upsert(
    {
      user_id: userId,
      display_name: p.displayName.trim() || null,
      avatar: p.avatar.trim() || null,
      instagram: p.instagram.trim() || null,
      level_label: p.levelLabel.trim() || null,
      is_public: p.isPublic,
    },
    { onConflict: "user_id" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}
