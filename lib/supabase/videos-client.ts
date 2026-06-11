import type { SubtitleWord, VideoSubtitleRow } from "@/lib/bichleg/types";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

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
  return data.map((row) => mapSubtitle(row as Record<string, unknown>));
}

export async function saveWordFromVideo(input: {
  zh: string;
  pinyin?: string;
  mn?: string;
  sourceVideoId: string;
}): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  if (!supabase || !hasSupabaseConfig) {
    return { ok: false, error: "Supabase тохируулагдаагүй." };
  }

  const { userId } = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, error: "Нэвтрээгүй хэрэглэгч." };
  }

  const { error } = await supabase.from("user_saved_words").insert({
    user_id: userId,
    zh: input.zh,
    pinyin: input.pinyin ?? null,
    mn: input.mn ?? null,
    source_video_id: input.sourceVideoId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, duplicate: true };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
