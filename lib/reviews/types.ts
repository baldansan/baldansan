export type ReviewItemType = "vocab" | "sentence" | "listening";

export type ReviewRating = "again" | "good" | "easy";

export type ReviewRow = {
  id: string;
  user_id: string;
  item_type: ReviewItemType;
  item_ref: string;
  ease: number;
  interval_days: number;
  due_at: string;
  last_result: string | null;
  reps: number;
  created_at: string;
  updated_at: string;
};

export type ReviewScheduleState = {
  ease: number;
  interval_days: number;
  reps: number;
};

export type ReviewScheduleUpdate = ReviewScheduleState & {
  due_at: Date;
  last_result: ReviewRating;
};

export type ReviewEnqueueItem = {
  item_type: ReviewItemType;
  item_ref: string;
};

export type LessonReviewEnqueueOptions = {
  /** Vocabulary ids (local id from lesson JSON, e.g. "nihao") */
  srsVocabIds?: string[];
  wrongItems?: Array<{
    item_type: "sentence" | "listening";
    localId: string;
  }>;
};
