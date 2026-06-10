import componentMeanings from "@/data/component_meanings.json";
import { shuffleArray } from "@/lib/games/game-data-core";
import type { HskWord } from "@/lib/hsk";

export type HskQuizKind =
  | "meaning"
  | "word-recall"
  | "pinyin"
  | "example-cloze"
  | "radical-pick";

export type HskQuizQuestion = {
  id: number;
  kind: HskQuizKind;
  correct: string;
  options: string[];
  promptLabel: string;
  display?: string;
  subDisplay?: string;
  hint?: string;
  hanzi?: string;
  pinyin?: string;
};

const OPTION_COUNT = 4;

type ComponentRow = { mn?: string; en?: string; icon?: string };

const COMPONENT_MAP = componentMeanings as Record<string, ComponentRow>;

function pickDistractors<T>(
  pool: T[],
  count: number,
  pick: (item: T) => string | null | undefined,
  exclude: Set<string>
): string[] {
  const out: string[] = [];
  for (const item of shuffleArray(pool)) {
    const v = pick(item)?.trim();
    if (!v || exclude.has(v) || out.includes(v)) continue;
    out.push(v);
    if (out.length >= count) break;
  }
  return out;
}

function mcqOptions(correct: string, wrong: string[]): string[] {
  return shuffleArray([correct, ...wrong.slice(0, OPTION_COUNT - 1)]);
}

export function buildWordRecallDeck(
  words: HskWord[],
  size = 15
): HskQuizQuestion[] {
  const pool = words.filter((w) => w.simplified && w.meaning_mn?.trim());
  if (pool.length < OPTION_COUNT) return [];

  return shuffleArray(pool)
    .slice(0, size)
    .map((word) => {
      const correct = word.simplified;
      const wrong = pickDistractors(
        pool.filter((w) => w.id !== word.id),
        OPTION_COUNT - 1,
        (w) => w.simplified,
        new Set([correct])
      );
      return {
        id: word.id,
        kind: "word-recall" as const,
        correct,
        options: mcqOptions(correct, wrong),
        promptLabel: "Зөв ханзыг сонго",
        display: word.meaning_mn!.trim(),
        subDisplay: word.pinyin?.trim() ?? undefined,
        hanzi: correct,
        pinyin: word.pinyin ?? undefined,
      };
    });
}

export function buildPinyinDeck(
  words: HskWord[],
  size = 15
): HskQuizQuestion[] {
  const pool = words.filter((w) => w.simplified && w.pinyin?.trim());
  if (pool.length < OPTION_COUNT) return [];

  return shuffleArray(pool)
    .slice(0, size)
    .map((word) => {
      const correct = word.pinyin!.trim();
      const wrong = pickDistractors(
        pool.filter((w) => w.id !== word.id),
        OPTION_COUNT - 1,
        (w) => w.pinyin,
        new Set([correct])
      );
      return {
        id: word.id,
        kind: "pinyin" as const,
        correct,
        options: mcqOptions(correct, wrong),
        promptLabel: "Зөв пиньинь сонго",
        display: word.simplified,
        subDisplay: word.meaning_mn?.trim() ?? undefined,
        hanzi: word.simplified,
        pinyin: correct,
      };
    });
}

export function buildExampleClozeDeck(
  words: HskWord[],
  size = 15
): HskQuizQuestion[] {
  const pool = words.filter(
    (w) =>
      w.simplified &&
      w.example_zh?.includes(w.simplified) &&
      w.meaning_mn?.trim()
  );
  if (pool.length < OPTION_COUNT) return [];

  return shuffleArray(pool)
    .slice(0, size)
    .map((word) => {
      const correct = word.simplified;
      const sentence = word.example_zh!.replace(
        word.simplified,
        "______"
      );
      const wrong = pickDistractors(
        pool.filter((w) => w.id !== word.id),
        OPTION_COUNT - 1,
        (w) => w.simplified,
        new Set([correct])
      );
      return {
        id: word.id,
        kind: "example-cloze" as const,
        correct,
        options: mcqOptions(correct, wrong),
        promptLabel: "Дутуу үгийг бөглө",
        display: sentence,
        subDisplay: word.example_mn?.trim() ?? word.meaning_mn?.trim(),
        hint: word.example_pinyin?.trim(),
        hanzi: correct,
        pinyin: word.pinyin ?? undefined,
      };
    });
}

function radicalLabel(radical: string): { icon: string; name: string } {
  const row = COMPONENT_MAP[radical];
  const icon = row?.icon?.trim() || "🧩";
  const name =
    row?.mn?.trim() || row?.en?.trim() || radical;
  return { icon, name };
}

export function buildRadicalPickDeck(
  words: HskWord[],
  size = 15
): HskQuizQuestion[] {
  const pool = words.filter((w) => w.simplified && w.radical?.trim());
  if (pool.length < OPTION_COUNT) return [];

  return shuffleArray(pool)
    .slice(0, size)
    .map((word) => {
      const correct = word.simplified;
      const { icon, name } = radicalLabel(word.radical!.trim());
      const wrong = pickDistractors(
        pool.filter((w) => w.id !== word.id),
        OPTION_COUNT - 1,
        (w) => w.simplified,
        new Set([correct])
      );
      return {
        id: word.id,
        kind: "radical-pick" as const,
        correct,
        options: mcqOptions(correct, wrong),
        promptLabel: "Энэ радикалтай ханз аль вэ?",
        display: `${icon} ${name}`,
        subDisplay: `Радикал: ${word.radical}`,
        hanzi: correct,
        pinyin: word.pinyin ?? undefined,
      };
    });
}

const MARATHON_KINDS: HskQuizKind[] = [
  "meaning",
  "word-recall",
  "pinyin",
  "example-cloze",
  "radical-pick",
];

function buildMeaningOne(words: HskWord[], word: HskWord): HskQuizQuestion | null {
  if (!word.meaning_mn?.trim()) return null;
  const correct = word.meaning_mn.trim();
  const wrong = pickDistractors(
    words.filter((w) => w.id !== word.id),
    OPTION_COUNT - 1,
    (w) => w.meaning_mn,
    new Set([correct])
  );
  return {
    id: word.id,
    kind: "meaning",
    correct,
    options: mcqOptions(correct, wrong),
    promptLabel: "Энэ үгийн утга?",
    display: word.simplified,
    subDisplay: word.pinyin?.trim(),
    hanzi: word.simplified,
    pinyin: word.pinyin ?? undefined,
  };
}

/** Mixed SRS marathon: rotate question kinds from the same word pool. */
export function buildSrsMarathonDeck(
  words: HskWord[],
  size = 15
): HskQuizQuestion[] {
  if (words.length < OPTION_COUNT) return [];

  const shuffled = shuffleArray(words);
  const out: HskQuizQuestion[] = [];

  for (let i = 0; i < size; i++) {
    const kind = MARATHON_KINDS[i % MARATHON_KINDS.length];
    const word = shuffled[i % shuffled.length];

    if (kind === "meaning") {
      const q = buildMeaningOne(words, word);
      if (q) out.push(q);
      continue;
    }

    const deckBuilders = {
      "word-recall": buildWordRecallDeck,
      pinyin: buildPinyinDeck,
      "example-cloze": buildExampleClozeDeck,
      "radical-pick": buildRadicalPickDeck,
    } as const;

    const deck = deckBuilders[kind](
      words.filter((w) =>
        kind === "radical-pick"
          ? w.radical
          : kind === "example-cloze"
            ? w.example_zh?.includes(w.simplified)
            : kind === "pinyin"
              ? w.pinyin
              : w.meaning_mn
      ),
      8
    );
    const match = deck.find((q) => q.id === word.id) ?? deck[0];
    if (match) out.push(match);
  }

  return out.slice(0, size);
}

/** Daily challenge: 10 mixed questions. */
export function buildDailyChallengeDeck(words: HskWord[]): HskQuizQuestion[] {
  return buildSrsMarathonDeck(words, 10);
}

export function scoreQuizResult(
  correct: number,
  total: number,
  livesLeft: number,
  streak = 0
): number {
  const base = correct * 10;
  const lifeBonus = livesLeft * 5;
  const streakBonus = streak * 2;
  const perfectBonus = correct === total && total > 0 ? 15 : 0;
  return base + lifeBonus + streakBonus + perfectBonus;
}
