import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/client";

export const ACTIVITY_SURFACES = [
  "lesson",
  "video",
  "game",
  "writing",
  "review",
  "mock",
] as const;

export type ActivitySurfaceKey = (typeof ACTIVITY_SURFACES)[number];

export type ActivityDayRow = {
  day: string; // YYYY-MM-DD
  minutesBySurface: Record<ActivitySurfaceKey, number>;
  totalMinutes: number;
  learners: number;
};

export type ActivityTimeOverview = {
  days: ActivityDayRow[];
  totalMinutes: number;
  totalLearners: number;
  windowDays: number;
  warnings: string[];
};

type SessionRow = {
  user_id: string;
  surface: string;
  seconds: number;
  day: string;
};

function emptySurfaces(): Record<ActivitySurfaceKey, number> {
  return { lesson: 0, video: 0, game: 0, writing: 0, review: 0, mock: 0 };
}

function isSurfaceKey(v: string): v is ActivitySurfaceKey {
  return (ACTIVITY_SURFACES as readonly string[]).includes(v);
}

/** Minutes per day per surface for the last `windowDays` days (admin RLS). */
export async function getActivityTimeOverview(
  windowDays = 14
): Promise<ActivityTimeOverview> {
  const empty = (warning: string): ActivityTimeOverview => ({
    days: [],
    totalMinutes: 0,
    totalLearners: 0,
    windowDays,
    warnings: [warning],
  });

  if (!hasSupabaseConfig) return empty("Supabase is not configured.");
  const client = await createServerSupabaseClient();
  if (!client) return empty("Could not create Supabase server client.");

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (windowDays - 1));
  const sinceDay = since.toISOString().slice(0, 10);

  const { data, error } = await client
    .from("user_activity_sessions")
    .select("user_id, surface, seconds, day")
    .gte("day", sinceDay)
    .order("day", { ascending: false })
    .limit(20000);

  if (error) {
    return empty(
      `user_activity_sessions уншиж чадсангүй: ${error.message} (050 migration ажилласан эсэхийг шалга).`
    );
  }

  const rows = (data ?? []) as SessionRow[];
  const byDay = new Map<string, { secs: Record<ActivitySurfaceKey, number>; users: Set<string> }>();
  const allUsers = new Set<string>();
  let totalSeconds = 0;

  for (const r of rows) {
    if (!isSurfaceKey(r.surface)) continue;
    const secs = Number(r.seconds) || 0;
    if (secs <= 0) continue;
    let bucket = byDay.get(r.day);
    if (!bucket) {
      bucket = { secs: emptySurfaces(), users: new Set() };
      byDay.set(r.day, bucket);
    }
    bucket.secs[r.surface] += secs;
    bucket.users.add(r.user_id);
    allUsers.add(r.user_id);
    totalSeconds += secs;
  }

  const days: ActivityDayRow[] = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, b]) => {
      const minutesBySurface = emptySurfaces();
      let total = 0;
      for (const k of ACTIVITY_SURFACES) {
        minutesBySurface[k] = Math.round(b.secs[k] / 60);
        total += b.secs[k];
      }
      return {
        day,
        minutesBySurface,
        totalMinutes: Math.round(total / 60),
        learners: b.users.size,
      };
    });

  return {
    days,
    totalMinutes: Math.round(totalSeconds / 60),
    totalLearners: allUsers.size,
    windowDays,
    warnings: [],
  };
}
