import { mongoliaDay } from "@/lib/analytics/activity-tracker";
import { MONGOLIA_TIME_ZONE } from "@/lib/datetime/mongolia-time";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { sourceIcon, sourceLabel } from "@/lib/points/points-config";

/**
 * Сурагчийн тайлан: "хэдэн цагт юу хийсэн, хэдэн оноо авсан".
 * user_points_ledger (оноотой үйлдэл) + user_activity_sessions (зарцуулсан хугацаа)
 * хоёрыг өдрөөр бүлэглэж нэгтгэнэ.
 */

export type TimelineEntry = {
  /** ISO цаг (эрэмбэлэх, цаг харуулахад). */
  at: string;
  /** Улаанбаатарын цагаар "HH:MM". */
  time: string;
  kind: "points" | "activity";
  icon: string;
  title: string;
  detail?: string;
  points: number;
  seconds: number;
  source?: string;
};

export type TimelineDay = {
  /** YYYY-MM-DD (Улаанбаатар). */
  day: string;
  totalPoints: number;
  totalSeconds: number;
  entries: TimelineEntry[];
};

const SURFACE_LABEL: Record<string, { label: string; icon: string }> = {
  lesson: { label: "Хичээл судалсан", icon: "📘" },
  video: { label: "Видео үзсэн", icon: "🎬" },
  game: { label: "Тоглоом тоглосон", icon: "🎮" },
  writing: { label: "Бичих дасгал", icon: "✍️" },
  review: { label: "Давтлага", icon: "🔤" },
  mock: { label: "Шалгалтын дасгал", icon: "📝" },
};

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: MONGOLIA_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

type LedgerRow = {
  points: number;
  source: string;
  ref_id: string | null;
  meta: Record<string, unknown> | null;
  day: string;
  created_at: string;
  updated_at: string | null;
};

type SessionRow = {
  surface: string;
  ref_id: string | null;
  seconds: number;
  day: string;
  updated_at: string | null;
  created_at: string;
};

function ledgerTitle(row: LedgerRow): { title: string; detail?: string } {
  const meta = row.meta ?? {};
  const label = typeof meta.label === "string" ? meta.label : "";
  const base = sourceLabel(row.source);
  if (label) return { title: base, detail: label };
  if (row.source === "streak_bonus") return { title: base };
  const ref = row.ref_id ? row.ref_id.split(":")[0] : "";
  return { title: base, detail: ref || undefined };
}

/** Pure: нэгтгэж өдрөөр бүлэглэнэ (шинэ өдөр дээр). */
export function buildTimeline(
  ledger: LedgerRow[],
  sessions: SessionRow[]
): TimelineDay[] {
  const byDay = new Map<string, TimelineEntry[]>();
  const push = (day: string, e: TimelineEntry) => {
    const list = byDay.get(day) ?? [];
    list.push(e);
    byDay.set(day, list);
  };

  for (const row of ledger) {
    const at = row.updated_at ?? row.created_at;
    const t = ledgerTitle(row);
    push(row.day, {
      at,
      time: formatTime(at),
      kind: "points",
      icon: sourceIcon(row.source),
      title: t.title,
      detail: t.detail,
      points: row.points,
      seconds: 0,
      source: row.source,
    });
  }

  for (const s of sessions) {
    if (s.seconds < 30) continue; // 30 секундээс богино — шуугиан
    const at = s.updated_at ?? s.created_at;
    const meta = SURFACE_LABEL[s.surface] ?? { label: s.surface, icon: "⏱" };
    push(s.day, {
      at,
      time: formatTime(at),
      kind: "activity",
      icon: meta.icon,
      title: meta.label,
      detail: s.ref_id || undefined,
      points: 0,
      seconds: s.seconds,
    });
  }

  return [...byDay.entries()]
    .map(([day, entries]) => {
      entries.sort((a, b) => (a.at < b.at ? 1 : -1));
      return {
        day,
        entries,
        totalPoints: entries.reduce((n, e) => n + e.points, 0),
        totalSeconds: entries.reduce((n, e) => n + e.seconds, 0),
      };
    })
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}

/**
 * Сурагчийн тайлан татах. userId өгөөгүй бол өөрийн; багш / админ бусдын
 * тайланг RLS-ээр (055/056/071) харна.
 */
export async function fetchStudentTimeline(opts: {
  userId?: string;
  days?: number;
} = {}): Promise<TimelineDay[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  let userId = opts.userId;
  if (!userId) {
    userId = (await getAuthenticatedUserId()).userId ?? undefined;
  }
  if (!userId) return [];

  const days = Math.max(1, opts.days ?? 14);
  const since = mongoliaDay(new Date(Date.now() - (days - 1) * 86_400_000));

  const [ledgerRes, sessionRes] = await Promise.all([
    supabase
      .from("user_points_ledger")
      .select("points, source, ref_id, meta, day, created_at, updated_at")
      .eq("user_id", userId)
      .gte("day", since)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("user_activity_sessions")
      .select("surface, ref_id, seconds, day, created_at, updated_at")
      .eq("user_id", userId)
      .gte("day", since)
      .order("day", { ascending: false })
      .limit(1000),
  ]);

  if (ledgerRes.error) console.warn("[points] ledger fetch failed:", ledgerRes.error.message);
  if (sessionRes.error) console.warn("[points] sessions fetch failed:", sessionRes.error.message);

  return buildTimeline(
    (ledgerRes.data ?? []) as LedgerRow[],
    (sessionRes.data ?? []) as SessionRow[]
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 1) return `${seconds} сек`;
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} цаг ${rest} мин` : `${h} цаг`;
}
