import "server-only";

import {
  ensureServerBreakdownFullLoaded,
  getServerFullBreakdownEntry,
  getServerFullComponentMn,
} from "@/lib/hanzi/char-breakdown-full-server";
import type {
  HanziCharacterData,
  HanziComponent,
  HanziStructure,
} from "@/lib/games/hanzi-component-data";
import type { GameVocabItem } from "@/lib/games/game-types";

function mapStructure(s?: string): HanziStructure {
  const v = (s ?? "").toLowerCase();
  if (v.includes("зүүн")) return "left-right";
  if (v.includes("дээд") || v.includes("дээр")) return "top-bottom";
  if (v.includes("хүрээ")) return "surround";
  if (v.includes("давхар")) return "stacked";
  return "single";
}

/**
 * Builds per-character game data from the full breakdown catalog
 * (public/data/char_breakdown_full.json, ~9500 chars) so the stroke/component
 * game works for EVERY imported lesson — not just the 15 hardcoded chars.
 * Server-only: reads from disk, nothing is shipped to the client.
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
    if (!entry?.c || entry.c.length < 2) continue;

    const components: HanziComponent[] = entry.c.map((c) => {
      const name = c.mn?.trim() || getServerFullComponentMn(c.ch) || c.ch;
      return { component: c.ch, nameMn: name, meaningMn: name };
    });

    // Pinyin/meaning are word-level in the vocab — only attach them when the
    // vocabulary entry is exactly this character.
    const exactWord = vocabulary.find((w) => w.chinese.trim() === char);

    out[char] = {
      character: char,
      pinyin: exactWord?.pinyin?.trim() ?? "",
      meaningMn: exactWord?.mongolian?.trim() ?? "",
      structure: mapStructure(entry.s),
      components,
      formula: `${components.map((c) => c.component).join(" + ")} = ${char}`,
      mnemonicMn: entry.e?.trim() || undefined,
    };
  }
  return out;
}
