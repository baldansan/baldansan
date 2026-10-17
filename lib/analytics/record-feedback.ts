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
  screenshotUrl?: string | null;
  userAgent?: string | null;
  viewport?: string | null;
};

/** Fire-and-forget: never throws. */
export function recordFeedback(input: RecordFeedbackInput): void {
  if (!hasSupabaseConfig || !supabase) return;

  void (async () => {
    try {
      const { userId } = await getAuthenticatedUserId();
      const base = {
        user_id: userId,
        lesson_id: input.lessonId?.trim() || null,
        stage: input.stage,
        question_id: input.questionId ?? null,
        rating: input.rating ?? null,
        note: input.note?.trim() || null,
        page_path: input.pagePath?.trim() || null,
      };
      const hasExtra = Boolean(input.screenshotUrl || input.userAgent || input.viewport);
      if (hasExtra) {
        const { error } = await supabase.from("feedback").insert({
          ...base,
          screenshot_url: input.screenshotUrl ?? null,
          user_agent: input.userAgent?.slice(0, 300) ?? null,
          viewport: input.viewport?.slice(0, 40) ?? null,
        });
        if (!error) return;
        // 077 migration ажиллаагүй (багана байхгүй) → URL-ийг note дотор хадгална.
        const extra = [
          input.screenshotUrl ? `📷 ${input.screenshotUrl}` : null,
          input.viewport ? `Дэлгэц: ${input.viewport}` : null,
        ]
          .filter(Boolean)
          .join("\n");
        await supabase
          .from("feedback")
          .insert({ ...base, note: extra ? `${base.note ?? ""}\n\n${extra}`.trim() : base.note });
        return;
      }
      const { error } = await supabase.from("feedback").insert(base);
      if (error) return;
    } catch {
      // silent
    }
  })();
}
