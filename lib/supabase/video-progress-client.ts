import { isVideoWatchCompleted } from "@/lib/bichleg/video-progress-utils";
import type { BichlegContinueTarget, UserVideoProgress } from "@/lib/bichleg/types";
import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

function mapProgressRow(raw: Record<string, unknown>): UserVideoProgress {
  return {
    video_id: String(raw.video_id),
    watched_sec: Number(raw.watched_sec ?? 0),
    completed: Boolean(raw.completed),
    last_watched_at: String(raw.last_watched_at),
  };
}

/** Upsert watch position; only increases watched_sec. Silent no-op when logged out. */
export async function upsertVideoWatchProgress(input: {
  videoId: string;
  watchedSec: number;
  durationSec: number | null;
}): Promise<{ ok: boolean; progress?: UserVideoProgress }> {
  if (!supabase || !hasSupabaseConfig) return { ok: false };

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return { ok: false };

  const watchedSec = Math.max(0, Number(input.watchedSec));
  if (!Number.isFinite(watchedSec)) return { ok: false };

  const { data: existing, error: readError } = await supabase
    .from("user_video_progress")
    .select("watched_sec, completed")
    .eq("user_id", userId)
    .eq("video_id", input.videoId)
    .maybeSingle();

  if (readError) return { ok: false };

  const prevWatched = Number(existing?.watched_sec ?? 0);
  const newWatched = Math.max(prevWatched, watchedSec);
  if (newWatched <= prevWatched) return { ok: true };

  const completed =
    Boolean(existing?.completed) ||
    isVideoWatchCompleted(newWatched, input.durationSec);

  const row = {
    user_id: userId,
    video_id: input.videoId,
    watched_sec: newWatched,
    completed,
    last_watched_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_video_progress")
    .upsert(row, { onConflict: "user_id,video_id" });

  if (error) return { ok: false };

  return {
    ok: true,
    progress: {
      video_id: input.videoId,
      watched_sec: newWatched,
      completed,
      last_watched_at: row.last_watched_at,
    },
  };
}

export async function fetchBichlegContinueTargetClient(): Promise<BichlegContinueTarget | null> {
  if (!supabase || !hasSupabaseConfig) return null;

  const { userId } = await getAuthenticatedUserId();
  if (!userId) return null;

  const { data: progress, error } = await supabase
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
  const { data: video } = await supabase
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
