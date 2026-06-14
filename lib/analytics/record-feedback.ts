import { getAuthenticatedUserId } from "@/lib/supabase/auth";
import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";

export type FeedbackStage =
  | "question"
  | "lesson_feedback"
  | "report";

export type QuestionFeedbackRating = "up" | "down";

export type LessonDifficultyRating = "hard" | "medium" | "easy";

export type RecordFeedbackInput = {
  stage: FeedbackStage;
  lessonId?: string | null;
  questionId?: string | null;
  rating?: string | null;
  note?: string | null;
  pagePath?: string | null;
};

/** Fire-and-forget: never throws. */
export function recordFeedback(input: RecordFeedbackInput): void {
  if (!hasSupabaseConfig || !supabase) return;

  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      const { error } = await supabase.from("feedback").insert({
        user_id: userId,
        lesson_id: input.lessonId?.trim() || null,
        stage: input.stage,
        question_id: input.questionId ?? null,
        rating: input.rating ?? null,
        note: input.note?.trim() || null,
        page_path: input.pagePath?.trim() || null,
      });
      if (error) return;
    } catch {
      // silent
    }
  })();
}
