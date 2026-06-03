import type { ReviewItemType } from "@/lib/reviews/types";

const REF_SEP = "-";

/** e.g. hsk1-l01-nihao-vocab-nihao */
export function buildReviewItemRef(
  lessonId: string,
  itemType: ReviewItemType,
  localId: string
): string {
  return `${lessonId}${REF_SEP}${itemType}${REF_SEP}${localId}`;
}

export function parseReviewItemRef(itemRef: string): {
  lessonId: string;
  itemType: ReviewItemType;
  localId: string;
} | null {
  const suffixes: ReviewItemType[] = ["vocab", "sentence", "listening"];
  for (const itemType of suffixes) {
    const marker = `${REF_SEP}${itemType}${REF_SEP}`;
    const index = itemRef.indexOf(marker);
    if (index > 0) {
      return {
        lessonId: itemRef.slice(0, index),
        itemType,
        localId: itemRef.slice(index + marker.length),
      };
    }
  }
  return null;
}
