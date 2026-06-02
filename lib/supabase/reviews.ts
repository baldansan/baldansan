import { hasSupabaseConfig, supabase } from "@/lib/supabase/client";
import { applySm2Lite, initialReviewSchedule } from "@/lib/reviews/scheduler";
import type {
  ReviewEnqueueItem,
  ReviewRating,
  ReviewRow,
} from "@/lib/reviews/types";

export type ReviewsResult<T> = {
  data: T | null;
  error: string | null;
};

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

const REVIEW_SELECT =
  "id, user_id, item_type, item_ref, ease, interval_days, due_at, last_result, reps, created_at, updated_at";

function notConfigured<T>(): ReviewsResult<T> {
  return { data: null, error: NOT_CONFIGURED_MESSAGE };
}

function toErrorMessage(error: { message: string } | null): string | null {
  return error?.message ?? null;
}

export async function upsertReviewQueueItems(
  userId: string,
  items: ReviewEnqueueItem[]
): Promise<ReviewsResult<ReviewRow[]>> {
  if (!supabase) {
    return notConfigured();
  }
  if (items.length === 0) {
    return { data: [], error: null };
  }

  const now = new Date().toISOString();
  const rows = items.map((item) => ({
    user_id: userId,
    item_type: item.item_type,
    item_ref: item.item_ref,
    ease: initialReviewSchedule().ease,
    interval_days: 0,
    due_at: now,
    reps: 0,
    last_result: null,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("reviews")
    .upsert(rows, { onConflict: "user_id,item_ref" })
    .select(REVIEW_SELECT);

  return {
    data: (data as ReviewRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function getDueReviews(
  userId: string,
  limit = 50
): Promise<ReviewsResult<ReviewRow[]>> {
  if (!supabase) {
    return notConfigured();
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("user_id", userId)
    .lte("due_at", now)
    .order("due_at", { ascending: true })
    .limit(limit);

  return {
    data: (data as ReviewRow[] | null) ?? [],
    error: toErrorMessage(error),
  };
}

export async function getDueReviewCount(
  userId: string
): Promise<ReviewsResult<number>> {
  if (!supabase) {
    return notConfigured();
  }

  const now = new Date().toISOString();
  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("due_at", now);

  return {
    data: count ?? 0,
    error: toErrorMessage(error),
  };
}

export async function applyReviewRating(
  userId: string,
  reviewId: string,
  rating: ReviewRating
): Promise<ReviewsResult<ReviewRow>> {
  if (!supabase) {
    return notConfigured();
  }

  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("id", reviewId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: toErrorMessage(fetchError) };
  }
  if (!existing) {
    return { data: null, error: "Review item not found." };
  }

  const row = existing as ReviewRow;
  const next = applySm2Lite(
    {
      ease: row.ease,
      interval_days: row.interval_days,
      reps: row.reps,
    },
    rating
  );

  const { data, error } = await supabase
    .from("reviews")
    .update({
      ease: next.ease,
      interval_days: next.interval_days,
      reps: next.reps,
      due_at: next.due_at.toISOString(),
      last_result: next.last_result,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("user_id", userId)
    .select(REVIEW_SELECT)
    .single();

  return {
    data: data as ReviewRow | null,
    error: toErrorMessage(error),
  };
}

export { hasSupabaseConfig };
