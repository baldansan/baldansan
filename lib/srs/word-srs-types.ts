import type { HskWordRow } from "@/lib/supabase/hsk-words";

export type WordSrsRating = "forgot" | "hard" | "known";

export type WordSrsRow = {
  id: string;
  user_id: string;
  word_id: number;
  reps: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_rating: WordSrsRating | null;
  created_at?: string;
  updated_at?: string;
};

export type WordSrsQueueItem = {
  srs: WordSrsRow | null;
  word: HskWordRow;
  isNew: boolean;
};

export type WordSrsScheduleState = {
  reps: number;
  ease: number;
  interval_days: number;
};

export type WordSrsScheduleUpdate = WordSrsScheduleState & {
  due_at: Date;
  last_rating: WordSrsRating;
};

export const DAILY_SRS_GOAL = 20;
