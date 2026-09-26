import type { FullBreakdownEntry } from "@/lib/hanzi/char-breakdown-full";
import type {
  HanziCharacterData,
  HanziComponent,
  HanziComponentKind,
  HanziStructure,
} from "@/lib/games/hanzi-component-data";
import type { GameVocabItem } from "@/lib/games/game-types";

function mapStructure(s?: string): HanziStructure {
  const v = (s ?? "").toLowerCase();
  if (v.includes("хүрээ")) return "surround";
  if (v.includes("зүүн")) return "left-right";
  if (v.includes("дээд") || v.includes("дээр")) return "top-bottom";
  if (v.includes("давхар")) return "stacked";
  return "single";
}

function mapKind(k?: string): HanziComponentKind {
  if (k === "radical" || k === "stroke" || k === "other") return k;
  return "char";
}

type Lookups = {
  getMn: (glyph: string) => string;
  getZh: (glyph: string) => string;
};

/**
 * Pure mapping: dataset entry (char_breakdown_full.json) → game data.
 * Pinyin/meaning are word-level in the vocab — only attached when the
 * vocabulary entry is exactly this character.
 */
export function buildHanziDataFromFullEntry(
  char: string,
  entry: FullBreakdownEntry,
  vocabulary: GameVocabItem[],
  { getMn, getZh }: Lookups
): HanziCharacterData | null {
  const components: HanziComponent[] = (entry.c ?? [])
    .filter((c) => c.ch?.trim())
    .map((c) => {
      const glyph = c.ch.trim();
      const mn = c.mn?.trim() || getMn(glyph) || "";
      const zh = c.zh?.trim() || getZh(glyph) || "";
      return {
        component: glyph,
        nameMn: mn || glyph,
        meaningMn: mn || glyph,
        nameZh: zh || undefined,
        role: c.role,
        phoneticPinyin: c.py?.trim() || undefined,
        kind: mapKind(c.k),
      };
    });

  const exactWord = vocabulary.find((w) => w.chinese.trim() === char);

  return {
    character: char,
    pinyin: exactWord?.pinyin?.trim() ?? "",
    meaningMn: exactWord?.mongolian?.trim() ?? "",
    structure: mapStructure(entry.s),
    structureLabelMn: entry.s?.trim() || undefined,
    structureLabelZh: entry.sz?.trim() || undefined,
    components,
    formula:
      components.length > 0
        ? `${components.map((c) => c.component).join(" + ")} = ${char}`
        : char,
    type: entry.t,
    explanationMn: entry.e?.trim() || undefined,
    explanationZh: entry.ez?.trim() || undefined,
    radical: entry.r?.trim() || undefined,
    sub: entry.sub,
    incomplete: entry.inc === true || undefined,
  };
}
