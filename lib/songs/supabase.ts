/**
 * Дуу (karaoke) — Supabase-оос дууны videos мөрүүд.
 * Дуу = `videos.kind = 'song'` эсвэл tags-д 'song'; цуврал `songs-*`.
 * Сервер талд (page.tsx) л дуудна.
 */
import type { VideoRow, VideoSubtitleRow } from "@/lib/bichleg/types";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";
import { fetchVideoSubtitles, mapVideoRow } from "@/lib/supabase/videos-server";

const SONG_ROW_SELECT =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level, cover_url, thumbnail_url )";
const SONG_ROW_SELECT_CORE =
  "*, video_series ( id, title_zh, title_mn, description_mn, hsk_level )";

function isMissingColumnSelectError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("column") &&
    (lower.includes("does not exist") || lower.includes("could not find"))
  );
}

export async function fetchSongVideos(): Promise<VideoRow[]> {
  if (!hasServerSupabaseConfig) return [];
  const client = await createServerSupabaseClient();
  if (!client) return [];

  // 068 migration ажиллаагүй бол kind багана байхгүй → зөвхөн tags-аар.
  const primary = await client
    .from("videos")
    .select(SONG_ROW_SELECT)
    .or("kind.eq.song,tags.cs.{song}")
    .order("year", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  let rows = primary.data as Record<string, unknown>[] | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(SONG_ROW_SELECT_CORE)
      .contains("tags", ["song"])
      .order("created_at", { ascending: false });
    rows = fallback.data as Record<string, unknown>[] | null;
    error = fallback.error;
  }

  if (error || !rows) return [];
  return rows.map((row) => mapVideoRow(row));
}

export async function fetchSongVideoById(
  videoId: string
): Promise<{ video: VideoRow; subtitles: VideoSubtitleRow[] } | null> {
  if (!hasServerSupabaseConfig) return null;
  const client = await createServerSupabaseClient();
  if (!client) return null;

  const primary = await client
    .from("videos")
    .select(SONG_ROW_SELECT)
    .eq("id", videoId)
    .maybeSingle();

  let row = primary.data as Record<string, unknown> | null;
  let error = primary.error;

  if (error?.message && isMissingColumnSelectError(error.message)) {
    const fallback = await client
      .from("videos")
      .select(SONG_ROW_SELECT_CORE)
      .eq("id", videoId)
      .maybeSingle();
    row = fallback.data as Record<string, unknown> | null;
    error = fallback.error;
  }

  if (error || !row) return null;
  const video = mapVideoRow(row);
  const subtitles = await fetchVideoSubtitles(video.id);
  return { video, subtitles };
}
