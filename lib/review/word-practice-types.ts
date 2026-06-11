import type { WordSrsRating } from "@/lib/srs/word-srs-types";

export type SessionWordRow = {
  id: number;
  simplified: string;
  pinyin: string | null;
  meaning_mn: string | null;
  rating: WordSrsRating | null;
};

export type WordPracticeMode =
  | "radical"
  | "stroke"
  | "meaning-match"
  | "srs-retry";

export type PracticeCardDef = {
  mode: WordPracticeMode;
  emoji: string;
  title: string;
  description: string;
};

export const PRACTICE_CARDS: PracticeCardDef[] = [
  {
    mode: "radical",
    emoji: "🧩",
    title: "Задлах тоглоом",
    description: "Бүрэлдэхүүн, язгуур",
  },
  {
    mode: "stroke",
    emoji: "✏️",
    title: "Зурлагын дасгал",
    description: "Ханз бичих",
  },
  {
    mode: "meaning-match",
    emoji: "🔀",
    title: "Утга тааруулах",
    description: "Ханз ↔ утга",
  },
  {
    mode: "srs-retry",
    emoji: "🔁",
    title: "Дахин давтах",
    description: "SRS карт",
  },
];

export function buildSessionWordRows(
  items: { word: { id?: number | null; simplified: string; pinyin?: string | null; meaning_mn?: string | null } }[],
  ratings: Map<number, WordSrsRating>
): SessionWordRow[] {
  const seen = new Set<number>();
  const out: SessionWordRow[] = [];

  for (const item of items) {
    const id = item.word.id;
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      simplified: item.word.simplified,
      pinyin: item.word.pinyin ?? null,
      meaning_mn: item.word.meaning_mn ?? null,
      rating: ratings.get(id) ?? null,
    });
  }

  return out;
}

export function defaultSelectedWordIds(words: SessionWordRow[]): Set<number> {
  return new Set(
    words
      .filter((w) => w.rating === "forgot" || w.rating === "hard")
      .map((w) => w.id)
  );
}

export function countByRating(
  words: SessionWordRow[]
): Record<WordSrsRating, number> {
  const counts = { known: 0, hard: 0, forgot: 0 };
  for (const word of words) {
    if (word.rating) counts[word.rating] += 1;
  }
  return counts;
}
