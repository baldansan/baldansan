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
const CUSTOM_WORDS_MIN_DECK = 6;
const CUSTOM_WORDS_MAX_DECK = 8;

/** Цөөн үгтэй багцад асуултыг давтаж 6–8 болгоно. */
export function expandQuizDeck(
  deck: HskQuizQuestion[],
  minSize = CUSTOM_WORDS_MIN_DECK,
  maxSize = CUSTOM_WORDS_MAX_DECK
): HskQuizQuestion[] {
  if (deck.length === 0) return [];
  const target = Math.min(maxSize, Math.max(minSize, deck.length));
  const out: HskQuizQuestion[] = [];
  let seq = 0;
  let round = 0;
  while (out.length < target) {
    for (const item of shuffleArray(deck)) {
      if (out.length >= target) break;
      out.push({
        ...item,
        id: item.id * 10_000 + seq,
      });
      seq += 1;
    }
    round += 1;
    if (round > 12) break;
  }
  return shuffleArray(out).slice(0, target);
}

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
      const sentence = word.example_zh!.split(word.simplified).join("______");
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
  if (pool.length === 0) return [];

  const hanziFallback = [
    ...new Set(words.map((w) => w.simplified?.trim()).filter(Boolean)),
  ] as string[];

  const questions: HskQuizQuestion[] = [];

  for (const word of shuffleArray(pool).slice(0, size)) {
    const correct = word.simplified;
    const targetRadical = word.radical!.trim();
    const { icon, name } = radicalLabel(targetRadical);
    let wrong = pickDistractors(
      // A distractor with the SAME radical would also be a correct answer.
      pool.filter(
        (w) => w.id !== word.id && w.radical?.trim() !== targetRadical
      ),
      OPTION_COUNT - 1,
      (w) => w.simplified,
      new Set([correct])
    );
    if (wrong.length < OPTION_COUNT - 1) {
      wrong = [
        ...wrong,
        ...pickDistractors(
          hanziFallback.map((h) => ({ simplified: h })),
          OPTION_COUNT - 1 - wrong.length,
          (w) => w.simplified,
          new Set([correct, ...wrong])
        ),
      ];
    }
    if (wrong.length < OPTION_COUNT - 1) continue;
    questions.push({
      id: word.id,
      kind: "radical-pick",
      correct,
      options: mcqOptions(correct, wrong),
      promptLabel: "Энэ радикалтай ханз аль вэ?",
      display: `${icon} ${name}`,
      subDisplay: `Радикал: ${word.radical}`,
      hanzi: correct,
      pinyin: word.pinyin ?? undefined,
    });
  }

  return questions;
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

function singleKindDeck(
  words: HskWord[],
  kind: HskQuizKind,
  size: number
): HskQuizQuestion[] {
  switch (kind) {
    case "word-recall":
      return buildWordRecallDeck(words, size);
    case "pinyin":
      return buildPinyinDeck(words, size);
    case "example-cloze":
      return buildExampleClozeDeck(words, size);
    case "radical-pick":
      return buildRadicalPickDeck(words, size);
    case "meaning": {
      const pool = words.filter((w) => w.meaning_mn?.trim() && w.simplified);
      if (pool.length < OPTION_COUNT) return [];
      return shuffleArray(pool)
        .slice(0, size)
        .map((word) => buildMeaningOne(words, word))
        .filter((q): q is HskQuizQuestion => q != null);
    }
    default:
      return [];
  }
}

/** Mixed SRS marathon: rotate question kinds from the same word pool. */
export function buildSrsMarathonDeck(
  words: HskWord[],
  size = 15,
  kinds?: HskQuizKind[]
): HskQuizQuestion[] {
  if (words.length < OPTION_COUNT) return [];

  const rotation =
    kinds && kinds.length > 0 ? kinds : MARATHON_KINDS;

  if (rotation.length === 1) {
    return singleKindDeck(words, rotation[0]!, size);
  }

  const shuffled = shuffleArray(words);
  const out: HskQuizQuestion[] = [];

  for (let i = 0; i < size; i++) {
    const kind = rotation[i % rotation.length];
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
    const match = deck.find((q) => q.id === word.id);
    if (match && !out.some((q) => q.id === match.id && q.kind === match.kind)) {
      out.push(match);
    }
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
