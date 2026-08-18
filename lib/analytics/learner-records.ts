/**
 * Server mirrors for learner data that used to live only in localStorage
 * (Оюу оноо — 1-р үе шат). Every function is fire-and-forget: it never throws
 * and silently no-ops for guests, missing config, or network errors —
 * localStorage stays the source of truth for the UI.
 */

import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type GameResultRecord = {
  gameType: string;
  lessonId: string;
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  playedAt: string;
};

/** Insert one game play into `user_game_results` (logged-in users only). */
export function recordGameResultRemote(result: GameResultRecord): void {
  if (!hasSupabaseConfig || !supabase) return;
  const client = supabase;
  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      await client.from("user_game_results").insert({
        user_id: userId,
        game_type: result.gameType,
        lesson_id: result.lessonId ?? "",
        score: Math.round(Number(result.score) || 0),
        correct: Math.round(Number(result.correct) || 0),
        total: Math.round(Number(result.total) || 0),
        accuracy: Math.round(Number(result.accuracy) || 0),
        played_at: result.playedAt || new Date().toISOString(),
      });
    } catch {
      // silent — analytics must not affect learner UX
    }
  })();
}

/**
 * Record that the learner has written a character by hand
 * (`user_writing_chars`, first completion only — duplicates are ignored).
 */
export function recordWritingCharRemote(char: string): void {
  if (!hasSupabaseConfig || !supabase) return;
  const trimmed = (char ?? "").trim();
  if (!trimmed) return;
  const client = supabase;
  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      if (!userId) return;
      await client
        .from("user_writing_chars")
        .upsert(
          { user_id: userId, char: trimmed },
          { onConflict: "user_id,char", ignoreDuplicates: true }
        );
    } catch {
      // silent
    }
  })();
}
