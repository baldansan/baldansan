import "server-only";

import type { VideoSeriesInfo } from "@/lib/bichleg/types";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

export type AdminSeriesRow = VideoSeriesInfo & {
  episode_count: number;
};

export type AdminEpisodeRow = {
  id: string;
  episode_no: number | null;
  title_mn: string | null;
  title_zh: string | null;
  youtube_id: string;
  sync_offset_sec: number;
  subtitle_count: number;
};

function mapSeries(raw: Record<string, unknown>): VideoSeriesInfo {
  return {
    id: String(raw.id),
    title_zh: raw.title_zh ? String(raw.title_zh) : null,
    title_mn: raw.title_mn ? String(raw.title_mn) : null,
    description_mn: raw.description_mn ? String(raw.description_mn) : null,
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
  };
}

export async function fetchAdminSeriesList(): Promise<AdminSeriesRow[]> {
  if (!hasServiceRoleSupabaseConfig) return [];
  const client = createServiceRoleSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("video_series")
    .select("id, title_zh, title_mn, description_mn, hsk_level, videos(count)")
    .order("title_mn", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const videos = row.videos as { count: number }[] | { count: number } | null;
    const count = Array.isArray(videos)
      ? (videos[0]?.count ?? 0)
      : (videos?.count ?? 0);
    return {
      ...mapSeries(row as Record<string, unknown>),
      episode_count: count,
    };
  });
}

export async function fetchAdminSeriesEpisodes(
  seriesId: string
): Promise<{ series: VideoSeriesInfo | null; episodes: AdminEpisodeRow[] }> {
  if (!hasServiceRoleSupabaseConfig) {
    return { series: null, episodes: [] };
  }
  const client = createServiceRoleSupabaseClient();
  if (!client) return { series: null, episodes: [] };

  const [{ data: seriesData }, { data: videoData }] = await Promise.all([
    client
      .from("video_series")
      .select("id, title_zh, title_mn, description_mn, hsk_level")
      .eq("id", seriesId)
      .maybeSingle(),
    client
      .from("videos")
      .select("id, episode_no, title_mn, title_zh, youtube_id, sync_offset_sec, video_subtitles(count)")
      .eq("series_id", seriesId)
      .order("episode_no", { ascending: true, nullsFirst: true }),
  ]);

  const series = seriesData
    ? mapSeries(seriesData as Record<string, unknown>)
    : null;

  const episodes: AdminEpisodeRow[] = (videoData ?? []).map((row) => {
    const subs = row.video_subtitles as
      | { count: number }[]
      | { count: number }
      | null;
    const subtitleCount = Array.isArray(subs)
      ? (subs[0]?.count ?? 0)
      : (subs?.count ?? 0);

    return {
      id: String(row.id),
      episode_no: row.episode_no != null ? Number(row.episode_no) : null,
      title_mn: row.title_mn ? String(row.title_mn) : null,
      title_zh: row.title_zh ? String(row.title_zh) : null,
      youtube_id: String(row.youtube_id),
      sync_offset_sec: Number(row.sync_offset_sec ?? 0),
      subtitle_count: subtitleCount,
    };
  });

  return { series, episodes };
}
