import "server-only";

import {
  ensureServerBreakdownFullLoaded,
  getServerFullBreakdownEntry,
  getServerFullComponentMn,
  getServerFullComponentZh,
} from "@/lib/hanzi/char-breakdown-full-server";
import { buildHanziDataFromFullEntry } from "@/lib/games/hanzi-breakdown-catalog";
import type { HanziCharacterData } from "@/lib/games/hanzi-component-data";
import type { GameVocabItem } from "@/lib/games/game-types";

/**
 * Builds per-character game data from the verified breakdown dataset
 * (public/data/char_breakdown_full.json, built from makemeahanzi) so the
 * stroke/component game works for EVERY lesson. The dataset is the single
 * source of parts/structure. Server-only: reads from disk.
 */
export async function buildServerBreakdownCatalog(
  chars: string[],
  vocabulary: GameVocabItem[]
): Promise<Record<string, HanziCharacterData>> {
  const ok = await ensureServerBreakdownFullLoaded();
  if (!ok) return {};

  const out: Record<string, HanziCharacterData> = {};
  for (const raw of chars) {
    const char = raw.trim();
    if (!char || char.length !== 1 || out[char]) continue;

    const entry = getServerFullBreakdownEntry(char);
    if (!entry) continue;

    const data = buildHanziDataFromFullEntry(char, entry, vocabulary, {
      getMn: getServerFullComponentMn,
      getZh: getServerFullComponentZh,
    });
    if (data) out[char] = data;
  }
  return out;
}
