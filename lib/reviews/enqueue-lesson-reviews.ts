import { buildReviewItemRef } from "@/lib/reviews/item-ref";
import type { LessonReviewEnqueueOptions, ReviewEnqueueItem } from "@/lib/reviews/types";
import { upsertReviewQueueItems } from "@/lib/supabase/reviews";
type LessonV2EnqueueSource = {
  level: number;
  lesson_number: number;
  vocabulary?: Array<{ id: string; srs?: boolean }>;
};

export function buildEnqueueItemsFromLessonV2(
  lesson: LessonV2EnqueueSource
): ReviewEnqueueItem[] {
  const lessonKey = `hsk${lesson.level}-l${String(lesson.lesson_number).padStart(2, "0")}`;
  const items: ReviewEnqueueItem[] = [];

  for (const word of lesson.vocabulary ?? []) {
    if (word.srs) {
      items.push({
        item_type: "vocab",
        item_ref: buildReviewItemRef(lessonKey, "vocab", word.id),
      });
    }
  }

  return items;
}

export function buildEnqueueItemsFromOptions(
  lessonId: string,
  options?: LessonReviewEnqueueOptions
): ReviewEnqueueItem[] {
  if (!options) return [];

  const items: ReviewEnqueueItem[] = [];

  for (const vocabId of options.srsVocabIds ?? []) {
    items.push({
      item_type: "vocab",
      item_ref: buildReviewItemRef(lessonId, "vocab", vocabId),
    });
  }

  for (const wrong of options.wrongItems ?? []) {
    items.push({
      item_type: wrong.item_type,
      item_ref: buildReviewItemRef(lessonId, wrong.item_type, wrong.localId),
    });
  }

  return items;
}

export async function enqueueLessonReviews(
  userId: string,
  lessonId: string,
  options?: LessonReviewEnqueueOptions
): Promise<{ ok: boolean; error: string | null; count: number }> {
  const items = buildEnqueueItemsFromOptions(lessonId, options);
  if (items.length === 0) {
    return { ok: true, error: null, count: 0 };
  }

  const result = await upsertReviewQueueItems(userId, items);
  return {
    ok: !result.error,
    error: result.error,
    count: items.length,
  };
}

/** Record a single wrong exercise immediately (optional, outside lesson complete). */
export async function enqueueWrongExercise(
  userId: string,
  lessonId: string,
  itemType: "sentence" | "listening",
  localId: string
): Promise<{ ok: boolean; error: string | null }> {
  const result = await upsertReviewQueueItems(userId, [
    {
      item_type: itemType,
      item_ref: buildReviewItemRef(lessonId, itemType, localId),
    },
  ]);
  return { ok: !result.error, error: result.error };
}
