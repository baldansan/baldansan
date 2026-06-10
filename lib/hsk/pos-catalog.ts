/**
 * ICTPOS-style tags in public.hsk_words.pos (e.g. n, v, a, vn, nr).
 * Grouped into learner-facing Mongolian categories for "Ханз цээжлэх".
 */

export const MEMORIZE_BATCH_SIZE = 30;

export type PosCategoryId =
  | "all"
  | "n"
  | "v"
  | "a"
  | "d"
  | "m"
  | "r"
  | "p"
  | "c"
  | "other";

export type PosCategory = {
  id: PosCategoryId;
  labelMn: string;
  tags: string[];
};

/** UI categories — raw DB tags mapped via {@link resolvePosCategoryId}. */
export const POS_UI_CATEGORIES: PosCategory[] = [
  { id: "n", labelMn: "Нэр үг", tags: ["n", "nr", "ns", "nt", "nz"] },
  { id: "v", labelMn: "Үйл үг", tags: ["v", "vn"] },
  { id: "a", labelMn: "Тэмдэг нэр", tags: ["a", "ad", "an", "b"] },
  { id: "d", labelMn: "Дайвар үг", tags: ["d"] },
  { id: "m", labelMn: "Тоолох үг", tags: ["m", "q", "mq"] },
  { id: "r", labelMn: "Төлөөний үг", tags: ["r"] },
  { id: "p", labelMn: "Угтвар үг", tags: ["p"] },
  { id: "c", labelMn: "Холбоос үг", tags: ["c", "cc"] },
  {
    id: "other",
    labelMn: "Бусад",
    tags: [
      "g",
      "f",
      "t",
      "l",
      "s",
      "z",
      "u",
      "qv",
      "qt",
      "k",
      "e",
      "tg",
      "o",
      "Mg",
      "h",
      "Rg",
    ],
  },
];

const TAG_TO_CATEGORY = new Map<string, PosCategoryId>();
for (const cat of POS_UI_CATEGORIES) {
  for (const tag of cat.tags) {
    TAG_TO_CATEGORY.set(tag, cat.id);
  }
}

export function normalizePosTags(
  pos: string[] | string | null | undefined
): string[] {
  if (!pos) return [];
  if (Array.isArray(pos)) {
    return pos.map((tag) => String(tag).trim()).filter(Boolean);
  }
  const single = String(pos).trim();
  return single ? [single] : [];
}

export function resolvePosCategoryId(tag: string): PosCategoryId {
  return TAG_TO_CATEGORY.get(tag.trim()) ?? "other";
}

export function wordMatchesPosCategory(
  pos: string[] | string | null | undefined,
  categoryId: PosCategoryId
): boolean {
  if (categoryId === "all") return true;
  const tags = normalizePosTags(pos);
  if (tags.length === 0) return categoryId === "other";
  return tags.some((t) => resolvePosCategoryId(t) === categoryId);
}

export function getCategoryLabelMn(categoryId: PosCategoryId): string {
  if (categoryId === "all") return "Бүгд";
  return POS_UI_CATEGORIES.find((c) => c.id === categoryId)?.labelMn ?? "Бусад";
}

/** Short Mongolian label for a single raw POS tag (card chip). */
export function formatPosTagMn(tag: string): string {
  const id = resolvePosCategoryId(tag);
  return getCategoryLabelMn(id);
}

export function getPrimaryPosLabelMn(
  pos: string[] | string | null | undefined
): string | null {
  const tags = normalizePosTags(pos);
  if (!tags.length) return null;
  return formatPosTagMn(tags[0]);
}
