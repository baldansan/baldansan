import challengeData from "@/data/radical_challenge_data.json";
import { shuffleArray } from "@/lib/games/game-data-core";
import {
  orderHintFromStructure,
  type RadicalGameEntry,
} from "@/lib/games/radical-game-data";
import {
  activeLevelMatchesNumeric,
  type ActiveHskLevel,
} from "@/lib/hsk/active-hsk-level";

export type ChallengeComponentMeta = {
  name: string;
  icon: string;
};

export type RadicalChallengeEntry = {
  char: string;
  pinyin: string;
  meaning_mn: string;
  answer: string[];
  structure: string;
  etymology_mn: string;
  hsk_level: number;
};

export type ChallengeTier = {
  id: 0 | 1 | 2;
  label: string;
  badgeClass: string;
  showNames: boolean;
  showIcons: boolean;
  distractorCount: number;
  timeSeconds: number;
  baseScore: number;
};

export const CHALLENGE_TIERS: ChallengeTier[] = [
  {
    id: 0,
    label: "Амархан",
    badgeClass: "bg-[var(--app-primary)]",
    showNames: true,
    showIcons: true,
    distractorCount: 2,
    timeSeconds: 30,
    baseScore: 10,
  },
  {
    id: 1,
    label: "Дунд",
    badgeClass: "bg-amber-500",
    showNames: false,
    showIcons: true,
    distractorCount: 3,
    timeSeconds: 22,
    baseScore: 15,
  },
  {
    id: 2,
    label: "Хэцүү",
    badgeClass: "bg-red-500",
    showNames: false,
    showIcons: false,
    distractorCount: 4,
    timeSeconds: 20,
    baseScore: 20,
  },
];

const POOL = challengeData.distractors as string[];
const COMPONENT_MAP = challengeData.componentMap as Record<
  string,
  ChallengeComponentMeta
>;
const ALL_GAMES = challengeData.games as RadicalChallengeEntry[];

export function getRadicalChallengeEntries(): RadicalChallengeEntry[] {
  return ALL_GAMES;
}

export function filterChallengeEntriesByHskLevel(
  entries: RadicalChallengeEntry[],
  activeLevel: ActiveHskLevel
): RadicalChallengeEntry[] {
  return entries.filter((entry) =>
    activeLevelMatchesNumeric(activeLevel, entry.hsk_level)
  );
}

export function challengeTierForRound(roundIndex: number): ChallengeTier {
  if (roundIndex < 8) return CHALLENGE_TIERS[0];
  if (roundIndex < 16) return CHALLENGE_TIERS[1];
  return CHALLENGE_TIERS[2];
}

export function buildChallengeRoundOptions(
  entry: RadicalChallengeEntry,
  tier: ChallengeTier
): string[] {
  const answerSet = new Set(entry.answer);
  const distractors = shuffleArray(
    POOL.filter((glyph) => !answerSet.has(glyph))
  ).slice(0, tier.distractorCount);
  return shuffleArray([...entry.answer, ...distractors]);
}

export function getChallengeComponentMeta(
  glyph: string
): ChallengeComponentMeta {
  return COMPONENT_MAP[glyph] ?? { name: "", icon: "🔘" };
}

export function isChallengeAnswerCorrect(
  selected: string[],
  answer: string[]
): boolean {
  return (
    selected.length === answer.length &&
    selected.every((part, index) => part === answer[index])
  );
}

export function calculateChallengeScore(
  tier: ChallengeTier,
  timeLeft: number,
  streakBefore: number
): { total: number; base: number; speed: number; streakBonus: number } {
  const speed = Math.max(0, timeLeft) * 2;
  const streakBonus = streakBefore * 2;
  return {
    base: tier.baseScore,
    speed,
    streakBonus,
    total: tier.baseScore + speed + streakBonus,
  };
}

export { orderHintFromStructure };

export function entryToBreakdown(
  entry: RadicalChallengeEntry
): RadicalGameEntry["breakdown"] {
  return entry.answer.map((glyph) => {
    const meta = getChallengeComponentMeta(glyph);
    return { c: glyph, name: meta.name, icon: meta.icon };
  });
}
