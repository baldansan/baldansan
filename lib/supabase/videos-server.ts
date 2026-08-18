import { normalizeSeriesCoverUrl } from "@/lib/bichleg/series-cover";
import { mapVideoSubtitleRow } from "@/lib/bichleg/map-subtitle";
import type {
  VideoEpisodeItem,
  VideoRow,
  VideoSeriesCard,
  VideoSeriesInfo,
  VideoSubtitleRow,
} from "@/lib/bichleg/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

function mapSeries(raw: Record<string, unknown> | null): VideoSeriesInfo | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    title_zh: raw.title_zh ? String(raw.title_zh) : null,
    title_mn: raw.title_mn ? String(raw.title_mn) : null,
    description_mn: raw.description_mn ? String(raw.description_mn) : null,
    cover_url: normalizeSeriesCoverUrl(
      raw.cover_url ? String(raw.cover_url) : null
    ),
    thumbnail_url: normalizeSeriesCoverUrl(
      raw.thumbnail_url ? String(raw.thumbnail_url) : null
    ),
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
  };
}

function readVideoCount(
  videos: { count: number }[] | { count: number } | null | undefined
): number {
  if (Array.isArray(videos)) return videos[0]?.count ?? 0;
  return videos?.count ?? 0;
}

function mapVideoEpisode(raw: Record<string, unknown>): VideoEpisodeItem {
  return {
    ...mapVideo(raw),
    subtitleCount: readVideoCount(
      raw.video_subtitles as { count: number }[] | { count: number } | null
    ),
  };
}

function mapVideo(raw: Record<string, unknown>): VideoRow {
  const seriesRaw = raw.video_series as Record<string, unknown> | null | undefined;
  return {
    id: String(raw.id),
    youtube_id: String(raw.youtube_id),
    title_zh: raw.title_zh ? String(raw.title_zh) : null,
    title_mn: raw.title_mn ? String(raw.title_mn) : null,
    source: raw.source ? String(raw.source) : null,
    source_url: raw.source_url ? String(raw.source_url) : null,
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
    duration_sec: raw.duration_sec != null ? Number(raw.duration_sec) : null,
    sync_offset_sec: Number(raw.sync_offset_sec ?? 0),
    subtitle_offset_sec: Number(
      raw.subtitle_offset_sec ?? raw.sync_offset_sec ?? 0
    ),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    series_id: raw.series_id ? String(raw.series_id) : null,
    episode_no: raw.episode_no != null ? Number(raw.episode_no) : null,
    series: mapSeries(seriesRaw ?? null),
    created_at: String(raw.created_at),
  };
}

const VIDEO_SERIES_SELECT =
  "id, title_zh, title_mn, description_mn, hsk_level, cover_url, thumbnail_url";
const VIDEO_SERIES_SELECT_CORE =
  "id, title_zh, title_mn, description_mn, hsk_level";

const VIDEO_ROW_SELECT =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level, cover_url, thumbnail_url )";
const VIDEO_ROW_SELECT_CORE =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level )";
const VIDEO_EPISODE_SELECT = `${VIDEO_ROW_SELECT}, video_subtitles(count)`;
const VIDEO_EPISODE_SELECT_CORE = `${VIDEO_ROW_SELECT_CORE}, video_subtitles(count)`;

function isMissingColumnSelectError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

export async function fetchVideoSeriesList(): Promise<VideoSeriesInfo[]> {
  const catalog = await fetchVideoSeriesCatalog();
  return catalog.map(({ videoCount: _count, ...series }) => series);
}

export async function fetchVideoSeriesCatalog(): Promise<VideoSeriesCard[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("video_series")
    .select(`${VIDEO_SERIES_SELECT}, videos(count)`)
    .order("title_mn", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("video_series")
      .select(`${VIDEO_SERIES_SELECT_CORE}, videos(count)`)
      .order("title_mn", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];

  // First episode per series — used as automatic YouTube thumbnail.
  const firstEpisodeBySeries = new Map<string, string>();
  const episodeRes = await client
    .from("videos")
    .select("series_id, youtube_id, episode_no")
    .not("series_id", "is", null)
    .order("episode_no", { ascending: true, nullsFirst: false });
  for (const ep of (episodeRes.data ?? []) as {
    series_id: string | null;
    youtube_id: string | null;
  }[]) {
    if (!ep.series_id || !ep.youtube_id) continue;
    if (!firstEpisodeBySeries.has(ep.series_id)) {
      firstEpisodeBySeries.set(ep.series_id, ep.youtube_id);
    }
  }

  return rows.map((row) => {
    const series = mapSeries(row as Record<string, unknown>)!;
    return {
      ...series,
      videoCount: readVideoCount(
        row.videos as { count: number }[] | { count: number } | null
      ),
      fallbackYoutubeId: firstEpisodeBySeries.get(series.id) ?? null,
    };
  });
}

export async function fetchVideoSeriesById(
  seriesId: string
): Promise<VideoSeriesInfo | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const primary = await client
    .from("video_series")
    .select(VIDEO_SERIES_SELECT)
    .eq("id", seriesId)
    .maybeSingle();

  let row = primary.data as Record<string, unknown> | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("video_series")
      .select(VIDEO_SERIES_SELECT_CORE)
      .eq("id", seriesId)
      .maybeSingle();
    row = fallback.data as Record<string, unknown> | null;
    error = fallback.error;
  }

  if (error || !row) return null;
  return mapSeries(row);
}

export async function countOrphanVideos(): Promise<number> {
  if (!hasServerSupabaseConfig) return 0;
  const client = await createServerSupabaseClient();
  if (!client) return 0;

  const { count, error } = await client
    .from("videos")
    .select("id", { count: "exact", head: true })
    .is("series_id", null);

  if (error) return 0;
  return count ?? 0;
}

export async function fetchSeriesEpisodes(
  seriesId: string
): Promise<VideoEpisodeItem[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_EPISODE_SELECT)
    .eq("series_id", seriesId)
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_EPISODE_SELECT_CORE)
      .eq("series_id", seriesId)
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[bichleg] fetchSeriesEpisodes failed", {
      seriesId,
      message: error.message,
    });
    return [];
  }
  if (!rows) return [];

  return rows.map((row) => mapVideoEpisode(row));
}

export async function fetchOrphanEpisodes(): Promise<VideoEpisodeItem[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_EPISODE_SELECT)
    .is("series_id", null)
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_EPISODE_SELECT_CORE)
      .is("series_id", null)
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error) {
    console.error("[bichleg] fetchOrphanEpisodes failed", { message: error.message });
    return [];
  }
  if (!rows) return [];

  return rows.map((row) => mapVideoEpisode(row));
}

export async function fetchVideosBySeriesId(
  seriesId: string
): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .eq("series_id", seriesId)
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .eq("series_id", seriesId)
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

export async function fetchOrphanVideos(): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .is("series_id", null)
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .is("series_id", null)
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

/** @deprecated Use fetchVideosBySeriesId or fetchOrphanVideos */
export async function fetchVideos(seriesId?: string | null): Promise<VideoRow[]> {
  if (seriesId) return fetchVideosBySeriesId(seriesId);
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const primary = await client
    .from("videos")
    .select(VIDEO_ROW_SELECT)
    .order("series_id", { ascending: true, nullsFirst: false })
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(VIDEO_ROW_SELECT_CORE)
      .order("series_id", { ascending: true, nullsFirst: false })
      .order("episode_no", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideo(row));
}

export async function fetchVideoSubtitles(
  videoId: string
): Promise<VideoSubtitleRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("video_subtitles")
    .select("*")
    .eq("video_id", videoId)
    .order("idx", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapVideoSubtitleRow(row as Record<string, unknown>));
}
