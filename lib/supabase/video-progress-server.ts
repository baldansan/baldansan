import type {
  BichlegContinueTarget,
  SeriesWatchProgress,
  UserVideoProgress,
} from "@/lib/bichleg/types";
import {
  resolveEpisodeWatchState,
  resolveSeriesContinueTarget,
  type SeriesWatchProgressDetail,
} from "@/lib/bichleg/episode-progress";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

function mapProgressRow(raw: Record<string, unknown>): UserVideoProgress {
  return {
    video_id: String(raw.video_id),
    watched_sec: Number(raw.watched_sec ?? 0),
    completed: Boolean(raw.completed),
    last_watched_at: String(raw.last_watched_at),
  };
}

export async function isServerUserAuthenticated(): Promise<boolean> {
  return (await getServerUserId()) != null;
}

async function getServerUserId(): Promise<string | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export type UserVideoProgressState = {
  /** false бол зочин — явцын UI огт харуулахгүй. */
  loggedIn: boolean;
  byVideoId: Record<string, UserVideoProgress>;
};

/**
 * Нэвтэрсэн эсэх + өгсөн бичлэгүүдийн явц — НЭГ auth + НЭГ query.
 * Хуудас дээр isServerUserAuthenticated-ийг давхар дуудахгүйн тулд энийг ашиглана.
 */
export async function fetchUserVideoProgressState(
  videoIds: string[]
): Promise<UserVideoProgressState> {
  const byVideoId: Record<string, UserVideoProgress> = {};

  const userId = await getServerUserId();
  if (!userId) return { loggedIn: false, byVideoId };
  if (!videoIds.length) return { loggedIn: true, byVideoId };

  const client = await createServerSupabaseClient();
  if (!client) return { loggedIn: true, byVideoId };

  const { data, error } = await client
    .from("user_video_progress")
    .select("video_id, watched_sec, completed, last_watched_at")
    .eq("user_id", userId)
    .in("video_id", videoIds);

  if (error || !data) return { loggedIn: true, byVideoId };

  for (const row of data) {
    const mapped = mapProgressRow(row as Record<string, unknown>);
    byVideoId[mapped.video_id] = mapped;
  }
  return { loggedIn: true, byVideoId };
}

export async function fetchUserVideoProgressMap(
  videoIds: string[]
): Promise<Record<string, UserVideoProgress>> {
  const { byVideoId } = await fetchUserVideoProgressState(videoIds);
  return byVideoId;
}

export type SeriesWatchProgressOverview = {
  loggedIn: boolean;
  bySeriesId: Record<string, SeriesWatchProgressDetail>;
};

type SeriesVideoLite = {
  id: string;
  series_id: string;
  title_mn: string | null;
  title_zh: string | null;
  episode_no: number | null;
  duration_sec: number | null;
  youtube_id: string | null;
  created_at: string;
};

function compareEpisodeOrder(a: SeriesVideoLite, b: SeriesVideoLite): number {
  const an = a.episode_no;
  const bn = b.episode_no;
  if (an != null && bn != null && an !== bn) return an - bn;
  if (an == null && bn != null) return -1;
  if (an != null && bn == null) return 1;
  return a.created_at.localeCompare(b.created_at);
}

/**
 * Цуврал бүрийн явц (N/M үзсэн, сүүлд үзсэн цаг, үргэлжлүүлэх анги) —
 * нэвтэрсэн хэрэглэгчид НЭГ auth + 2 query (videos, user_video_progress). N+1 байхгүй.
 */
export async function fetchSeriesWatchProgressOverview(
  seriesIds: string[],
  totalsBySeriesId: Record<string, number>
): Promise<SeriesWatchProgressOverview> {
  const bySeriesId: Record<string, SeriesWatchProgressDetail> = {};
  for (const id of seriesIds) {
    bySeriesId[id] = {
      watchedCount: 0,
      totalCount: totalsBySeriesId[id] ?? 0,
      inProgressCount: 0,
      lastWatchedAt: null,
      continueTarget: null,
    };
  }

  const userId = await getServerUserId();
  if (!userId) return { loggedIn: false, bySeriesId };
  if (!seriesIds.length) return { loggedIn: true, bySeriesId };

  const client = await createServerSupabaseClient();
  if (!client) return { loggedIn: true, bySeriesId };

  const { data: videos, error: videosError } = await client
    .from("videos")
    .select("id, series_id, title_mn, title_zh, episode_no, duration_sec, youtube_id, created_at")
    .in("series_id", seriesIds);

  if (videosError || !videos?.length) return { loggedIn: true, bySeriesId };

  const episodesBySeries = new Map<string, SeriesVideoLite[]>();
  for (const raw of videos as Record<string, unknown>[]) {
    const lite: SeriesVideoLite = {
      id: String(raw.id),
      series_id: String(raw.series_id),
      title_mn: raw.title_mn ? String(raw.title_mn) : null,
      title_zh: raw.title_zh ? String(raw.title_zh) : null,
      episode_no: raw.episode_no != null ? Number(raw.episode_no) : null,
      duration_sec: raw.duration_sec != null ? Number(raw.duration_sec) : null,
      youtube_id: raw.youtube_id ? String(raw.youtube_id) : null,
      created_at: String(raw.created_at ?? ""),
    };
    const list = episodesBySeries.get(lite.series_id) ?? [];
    list.push(lite);
    episodesBySeries.set(lite.series_id, list);
  }

  const videoIds = (videos as { id: unknown }[]).map((v) => String(v.id));
  const { data: progressRows, error: progressError } = await client
    .from("user_video_progress")
    .select("video_id, watched_sec, completed, last_watched_at")
    .eq("user_id", userId)
    .in("video_id", videoIds);

  if (progressError || !progressRows) return { loggedIn: true, bySeriesId };

  const progressByVideoId: Record<string, UserVideoProgress> = {};
  for (const row of progressRows) {
    const mapped = mapProgressRow(row as Record<string, unknown>);
    progressByVideoId[mapped.video_id] = mapped;
  }

  for (const [seriesId, list] of episodesBySeries) {
    const out = bySeriesId[seriesId];
    if (!out) continue;
    list.sort(compareEpisodeOrder);

    let lastAt = -1;
    let lastAtIso: string | null = null;
    for (const ep of list) {
      const p = progressByVideoId[ep.id];
      if (!p) continue;
      const state = resolveEpisodeWatchState(p, ep.duration_sec);
      if (state === "completed") out.watchedCount += 1;
      else if (state === "partial") out.inProgressCount += 1;
      if (p.watched_sec > 0) {
        const at = Date.parse(p.last_watched_at);
        if (Number.isFinite(at) && at > lastAt) {
          lastAt = at;
          lastAtIso = p.last_watched_at;
        }
      }
    }
    out.lastWatchedAt = lastAtIso;
    if (out.totalCount < list.length) out.totalCount = list.length;

    const target = resolveSeriesContinueTarget(list, progressByVideoId);
    if (target) {
      const ep = list.find((v) => v.id === target.videoId);
      out.continueTarget = {
        ...target,
        title_mn: ep?.title_mn ?? null,
        title_zh: ep?.title_zh ?? null,
        episode_no: ep?.episode_no ?? null,
        duration_sec: ep?.duration_sec ?? null,
        youtube_id: ep?.youtube_id ?? null,
      };
    }
  }

  return { loggedIn: true, bySeriesId };
}

/** Хуучин API — study-plan ашиглана. watchedCount/totalCount хэвээр, нэмэлт талбарууд ирнэ. */
export async function fetchSeriesWatchProgressMap(
  seriesIds: string[],
  totalsBySeriesId: Record<string, number>
): Promise<Record<string, SeriesWatchProgress>> {
  const { bySeriesId } = await fetchSeriesWatchProgressOverview(seriesIds, totalsBySeriesId);
  return bySeriesId;
}

export async function fetchBichlegContinueTarget(): Promise<BichlegContinueTarget | null> {
  const userId = await getServerUserId();
  if (!userId) return null;

  const client = await createServerSupabaseClient();
  if (!client) return null;

  const { data: progress, error } = await client
    .from("user_video_progress")
    .select("video_id, watched_sec, last_watched_at")
    .eq("user_id", userId)
    .eq("completed", false)
    .gt("watched_sec", 0)
    .order("last_watched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !progress) return null;

  const videoId = String(progress.video_id);
  const { data: video } = await client
    .from("videos")
    .select("id, title_mn, title_zh, series_id, episode_no")
    .eq("id", videoId)
    .maybeSingle();

  if (!video) return null;

  const seriesId = video.series_id ? String(video.series_id) : "other";
  const ep =
    video.episode_no != null ? `${Number(video.episode_no)}-р анги` : null;
  const title =
    (video.title_mn ? String(video.title_mn) : null) ??
    (video.title_zh ? String(video.title_zh) : null) ??
    "Бичлэг";

  return {
    href: `/bichleg/${encodeURIComponent(seriesId)}/${encodeURIComponent(videoId)}`,
    title,
    subtitle: ep ? `${ep} · үргэлжлүүлэх` : "Үргэлжлүүлэх",
  };
}
