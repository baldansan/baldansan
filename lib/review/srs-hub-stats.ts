/**
 * Үгийн SRS-ийн нэгдсэн статистик — /review hub болон /home «Өнөөдөр» хэсэг
 * хоёулаа ЭНЭ функцээр «хүлээж буй карт» тоогоо авна (нэг эх сурвалж).
 *
 * - Нэвтэрсэн + Supabase: user_word_srs статистик (dueToday)
 * - Нэвтрээгүй: localStorage SRS (local-word-srs)
 * - Supabase тохиргоогүй: тухайн түвшний үгсээс локал дараалал
 */

import type { ActiveHskLevel } from "@/lib/hsk/active-hsk-level";
import {
  buildLocalQueue,
  getLocalWordSrsStats,
  readLocalStudiedWordIds,
} from "@/lib/srs/local-word-srs";
import { DAILY_SRS_GOAL } from "@/lib/srs/word-srs-types";
import { hasSupabaseConfig } from "@/lib/supabase/auth";
import {
  fetchHskLevelTotals,
  fetchHskWordsByIds,
  fetchHskWordsByLevel,
  type HskWordRow,
} from "@/lib/supabase/hsk-words";
import {
  getDueWordQueue,
  getUserWordSrsStats,
} from "@/lib/supabase/user-word-srs";

export type SrsHubStats = {
  dueCards: number;
  dailyDone: number;
  dailyGoal: number;
  studiedCount: number;
  accuracyPct: number;
};

export const EMPTY_SRS_HUB_STATS: SrsHubStats = {
  dueCards: 0,
  dailyDone: 0,
  dailyGoal: DAILY_SRS_GOAL,
  studiedCount: 0,
  accuracyPct: 0,
};

function studiedLevelMap(words: HskWordRow[] | null | undefined) {
  const studiedWordLevels = new Map<number, number>();
  for (const word of words ?? []) {
    if (word.id == null) continue;
    const raw = word.hsk_level;
    if (raw == null || raw === "7-9") continue;
    const level = Number(raw);
    if (Number.isInteger(level) && level >= 1 && level <= 6) {
      studiedWordLevels.set(word.id, level);
    }
  }
  return studiedWordLevels;
}

export async function loadSrsHubStats(input: {
  userId: string | null;
  activeLevel: ActiveHskLevel;
}): Promise<SrsHubStats> {
  const { userId, activeLevel } = input;

  if (hasSupabaseConfig) {
    if (userId) {
      const { data } = await getUserWordSrsStats(userId);
      if (data) {
        return {
          dueCards: data.dueToday,
          dailyDone: data.dailyDone,
          dailyGoal: data.dailyGoal,
          studiedCount: data.studiedCount,
          accuracyPct: data.accuracyPct,
        };
      }
      const { items } = await getDueWordQueue(userId, activeLevel);
      return { ...EMPTY_SRS_HUB_STATS, dueCards: items.length };
    }
    const [{ totals }, { data: studiedWords }] = await Promise.all([
      fetchHskLevelTotals(),
      fetchHskWordsByIds(readLocalStudiedWordIds()),
    ]);
    const local = getLocalWordSrsStats(totals, studiedLevelMap(studiedWords));
    return {
      dueCards: local.dueToday,
      dailyDone: local.dailyDone,
      dailyGoal: local.dailyGoal,
      studiedCount: local.studiedCount,
      accuracyPct: local.accuracyPct,
    };
  }

  const [{ totals }, { data: studiedWords }, { data: words }] = await Promise.all([
    fetchHskLevelTotals(),
    fetchHskWordsByIds(readLocalStudiedWordIds()),
    fetchHskWordsByLevel(activeLevel, { limit: 500 }),
  ]);
  const local = getLocalWordSrsStats(totals, studiedLevelMap(studiedWords));
  return {
    dueCards: buildLocalQueue(words, activeLevel).length,
    dailyDone: local.dailyDone,
    dailyGoal: local.dailyGoal,
    studiedCount: local.studiedCount,
    accuracyPct: local.accuracyPct,
  };
}
