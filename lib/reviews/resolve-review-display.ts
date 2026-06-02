import { parseReviewItemRef } from "@/lib/reviews/item-ref";
import type { ReviewItemType, ReviewRow } from "@/lib/reviews/types";
import { getLessonById } from "@/lib/content";
import type { LessonV2VocabularyItem } from "@/types/lesson-v2";

export type ResolvedReviewDisplay = {
  itemType: ReviewItemType;
  itemRef: string;
  lessonId: string | null;
  localId: string | null;
  /** Vocab card payload when item_type === vocab */
  vocab?: LessonV2VocabularyItem;
  /** Sentence / listening prompt */
  promptZh?: string;
  promptMn?: string;
  audioUrl?: string;
};

export async function resolveReviewDisplay(
  row: ReviewRow
): Promise<ResolvedReviewDisplay> {
  const parsed = parseReviewItemRef(row.item_ref);
  const base: ResolvedReviewDisplay = {
    itemType: row.item_type,
    itemRef: row.item_ref,
    lessonId: parsed?.lessonId ?? null,
    localId: parsed?.localId ?? null,
  };

  if (!parsed?.lessonId) {
    return {
      ...base,
      promptMn: row.item_ref,
    };
  }

  if (row.item_type === "vocab" && parsed.localId) {
    const lesson = await getLessonById(parsed.lessonId);
    const word = lesson?.vocabulary.find(
      (entry) => entry.id === parsed.localId || entry.chinese === parsed.localId
    );
    if (word) {
      return {
        ...base,
        vocab: {
          id: word.id,
          zh: word.chinese,
          pinyin: word.pinyin,
          mn: word.mongolian,
          example_zh: word.exampleChinese,
          audio: word.audioUrl,
        },
        audioUrl: word.audioUrl,
      };
    }
    return {
      ...base,
      vocab: {
        id: parsed.localId,
        zh: parsed.localId,
        pinyin: "",
        mn: "—",
      },
    };
  }

  if (row.item_type === "sentence") {
    return {
      ...base,
      promptZh: parsed.localId,
      promptMn: "Өгүүлбэрийг монгол руу орчуулаад дахин шалгана уу.",
    };
  }

  return {
    ...base,
    promptMn: "Дахин сонсоод ойлгосноо баталгаажуулна уу.",
    promptZh: parsed.localId,
  };
}
