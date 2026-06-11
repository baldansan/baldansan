import type { VideoRow, VideoSubtitleRow, SubtitleWord } from "@/lib/bichleg/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

function mapVideo(raw: Record<string, unknown>): VideoRow {
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

export async function fetchVideos(): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("videos")
    .select("*")
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
