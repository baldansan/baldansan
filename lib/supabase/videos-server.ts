import type {
  VideoRow,
  VideoSeriesInfo,
  VideoSubtitleRow,
  SubtitleWord,
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
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
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
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    series_id: raw.series_id ? String(raw.series_id) : null,
    episode_no: raw.episode_no != null ? Number(raw.episode_no) : null,
    series: mapSeries(seriesRaw ?? null),
    created_at: String(raw.created_at),
  };
}

function mapSubtitle(raw: Record<string, unknown>): VideoSubtitleRow {
  let words: SubtitleWord[] | null = null;
  if (raw.words != null && Array.isArray(raw.words)) {
    words = raw.words.map((w) => {
      const word = w as Record<string, unknown>;
      return {
        zh: String(word.zh ?? ""),
        pinyin: word.pinyin ? String(word.pinyin) : undefined,
        mn: word.mn ? String(word.mn) : undefined,
        key: Boolean(word.key),
      };
    });
  }

  return {
    id: String(raw.id),
    video_id: String(raw.video_id),
    idx: Number(raw.idx),
    start_sec: Number(raw.start_sec),
    end_sec: Number(raw.end_sec),
    zh: raw.zh ? String(raw.zh) : null,
    pinyin: raw.pinyin ? String(raw.pinyin) : null,
    mn: raw.mn ? String(raw.mn) : null,
    words,
  };
}

export async function fetchVideoSeriesList(): Promise<VideoSeriesInfo[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("video_series")
    .select("id, title_zh, title_mn, description_mn, hsk_level")
    .order("title_mn", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapSeries(row as Record<string, unknown>)!);
}

export async function fetchVideos(seriesId?: string | null): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  let query = client
    .from("videos")
    .select(
      "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level )"
    );

  if (seriesId) {
    query = query.eq("series_id", seriesId);
  }

  const { data, error } = await query
    .order("series_id", { ascending: true, nullsFirst: false })
    .order("episode_no", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapVideo(row as Record<string, unknown>));
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
  return data.map((row) => mapSubtitle(row as Record<string, unknown>));
}
