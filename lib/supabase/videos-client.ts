import { mapVideoSubtitleRow } from "@/lib/bichleg/map-subtitle";
import type { VideoSubtitleRow } from "@/lib/bichleg/types";
import {
  getBichlegWordStatus,
  saveWordFromBichleg,
  type BichlegWordStatus,
  type SaveWordFromBichlegResult,
} from "@/lib/supabase/saved-words";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type { BichlegWordStatus, SaveWordFromBichlegResult };

export async function fetchVideoSubtitlesClient(
  videoId: string
): Promise<VideoSubtitleRow[]> {
  if (!supabase || !hasSupabaseConfig) return [];

  const { data, error } = await supabase
    .from("video_subtitles")
    .select("*")
    .eq("video_id", videoId)
    .order("idx", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapVideoSubtitleRow(row as Record<string, unknown>));
}

export async function fetchBichlegWordStatus(
  zh: string
): Promise<BichlegWordStatus> {
  return getBichlegWordStatus(zh);
}

export async function saveWordFromVideo(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
  sourceVideoId: string;
}): Promise<SaveWordFromBichlegResult> {
  return saveWordFromBichleg({
    zh: input.zh,
    pinyin: input.pinyin,
    mn: input.mn,
    sourceVideoId: input.sourceVideoId,
  });
}
