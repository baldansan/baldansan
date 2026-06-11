import type {
  BichlegContinueTarget,
  SeriesWatchProgress,
  UserVideoProgress,
} from "@/lib/bichleg/types";
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

async function getServerUserId(): Promise<string | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchUserVideoProgressMap(
  videoIds: string[]
): Promise<Record<string, UserVideoProgress>> {
  const out: Record<string, UserVideoProgress> = {};
  if (!videoIds.length) return out;

  const userId = await getServerUserId();
  if (!userId) return out;

  const client = await createServerSupabaseClient();
  if (!client) return out;

  const { data, error } = await client
    .from("user_video_progress")
    .select("video_id, watched_sec, completed, last_watched_at")
    .eq("user_id", userId)
    .in("video_id", videoIds);

  if (error || !data) return out;

  for (const row of data) {
    const mapped = mapProgressRow(row as Record<string, unknown>);
    out[mapped.video_id] = mapped;
  }
  return out;
}

export async function fetchSeriesWatchProgressMap(
  seriesIds: string[],
  totalsBySeriesId: Record<string, number>
): Promise<Record<string, SeriesWatchProgress>> {
  const out: Record<string, SeriesWatchProgress> = {};
  for (const id of seriesIds) {
    out[id] = {
      watchedCount: 0,
      totalCount: totalsBySeriesId[id] ?? 0,
    };
  }
  if (!seriesIds.length) return out;

  const userId = await getServerUserId();
  if (!userId) return out;

  const client = await createServerSupabaseClient();
  if (!client) return out;

  const { data: videos, error: videosError } = await client
    .from("videos")
    .select("id, series_id")
    .in("series_id", seriesIds);

  if (videosError || !videos?.length) return out;

  const videoIds = videos.map((v) => String(v.id));
  const seriesByVideo = new Map<string, string>();
  for (const row of videos) {
    seriesByVideo.set(String(row.id), String(row.series_id));
  }

  const { data: progress, error: progressError } = await client
    .from("user_video_progress")
    .select("video_id, completed")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("video_id", videoIds);

  if (progressError || !progress) return out;

  for (const row of progress) {
    const seriesId = seriesByVideo.get(String(row.video_id));
    if (!seriesId || !out[seriesId]) continue;
    out[seriesId].watchedCount += 1;
  }

  return out;
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
    href: `/bichleg/${encodeURIComponent(seriesId)}?v=${encodeURIComponent(videoId)}`,
    title,
    subtitle: ep ? `${ep} · үргэлжлүүлэх` : "Үргэлжлүүлэх",
  };
}
