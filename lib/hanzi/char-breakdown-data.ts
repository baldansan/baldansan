import charBreakdownData from "@/data/char_breakdown.json";
import componentMeaningsData from "@/data/component_meanings.json";
import { resolveComponentIcon } from "@/lib/hanzi/component-icon-map";
import type { DecompositionComponent } from "@/lib/hanzi/character-decomposition";

export type ComponentMeaning = {
  mn: string;
  en: string;
  icon: string;
};

export type CharBreakdownEntry = {
  components: string[];
  structure?: string;
  radical?: string;
  pinyin?: string;
  etymology_mn?: string;
  etymology_en?: string;
};

export type RadicalFallback = {
  glyph: string;
  labelMn: string | null;
};

export type RadicalLine = {
  glyph: string;
  labelMn: string | null;
};

export type CharBreakdownView = {
  char: string;
  parts: DecompositionComponent[];
  structure: string | null;
  etymology_mn: string | null;
  /** Hand-written etymology vs catalog description styling. */
  etymologyRich?: boolean;
  /** From char_breakdown_full r/rmn. */
  radicalLine?: RadicalLine | null;
  /** When no breakdown entry — from hsk_words.radical + component_meanings. */
  radicalFallback?: RadicalFallback | null;
};

const HANZI_RE = /[\u4e00-\u9fff]/;

const CHAR_BREAKDOWN = charBreakdownData as Record<string, CharBreakdownEntry>;
const COMPONENT_MEANINGS = componentMeaningsData as Record<
  string,
  ComponentMeaning
>;

export function getCharBreakdownEntry(char: string): CharBreakdownEntry | null {
  const key = char.trim();
  if (!key) return null;
  return CHAR_BREAKDOWN[key] ?? null;
}

export function getComponentMeaning(glyph: string): ComponentMeaning | null {
  const key = glyph.trim();
  if (!key) return null;
  const row = COMPONENT_MEANINGS[key];
  if (!row) return null;
  return {
    mn: row.mn?.trim() ?? "",
    en: row.en?.trim() ?? "",
    icon: row.icon?.trim() || resolveComponentIcon(key),
  };
}

export function componentDisplayLabel(glyph: string): string {
  const meaning = getComponentMeaning(glyph);
  if (!meaning) return "";
  return meaning.mn || meaning.en || "";
}

export function componentDisplayLabelOrDash(glyph: string): string {
  const label = componentDisplayLabel(glyph);
  return label || "—";
}

export function componentDisplayIcon(glyph: string): string {
  const meaning = getComponentMeaning(glyph);
  if (meaning?.icon) return meaning.icon;
  return resolveComponentIcon(glyph);
}

export function buildDecompositionParts(
  components: string[],
  options?: { includeUnknown?: boolean }
): DecompositionComponent[] {
  return components
    .map((glyph) => {
      const name = componentDisplayLabel(glyph);
      if (!name && !options?.includeUnknown) return null;
      return {
        c: glyph,
        name: name || "—",
        icon: componentDisplayIcon(glyph),
      };
    })
    .filter((row): row is DecompositionComponent => row !== null);
}

export function getCharBreakdownView(char: string): CharBreakdownView | null {
  const entry = getCharBreakdownEntry(char);
  if (!entry?.components?.length) {
    const etymology = entry?.etymology_mn?.trim();
    if (!etymology) return null;
    return {
      char,
      parts: [],
      structure: entry?.structure?.trim() || null,
      etymology_mn: etymology,
      etymologyRich: true,
    };
  }

  const parts = buildDecompositionParts(entry.components, {
    includeUnknown: true,
  });
  const etymology = entry.etymology_mn?.trim() || null;
  const structure = entry.structure?.trim() || null;
  if (parts.length === 0 && !etymology && !structure) return null;

  return {
    char,
    parts,
    structure,
    etymology_mn: etymology,
    etymologyRich: Boolean(etymology),
  };
}

export function hasCharBreakdown(char: string): boolean {
  return getCharBreakdownView(char) !== null;
}

/** Full word first, otherwise each hanzi glyph with breakdown data. */
export function getCharBreakdownEtymology(
  char: string,
  fallback = ""
): string {
  return getCharBreakdownEntry(char)?.etymology_mn?.trim() || fallback;
}

export function getCharBreakdownAnswer(
  char: string,
  fallback: string[]
): string[] {
  const components = getCharBreakdownEntry(char)?.components;
  return components?.length ? components : fallback;
}

export function resolveBreakdownCharsForText(text: string): CharBreakdownView[] {
  const zh = text.trim();
  if (!zh) return [];

  const full = getCharBreakdownView(zh);
  if (full) return [full];

  const singles: CharBreakdownView[] = [];
  for (const glyph of [...zh]) {
    const view = getCharBreakdownView(glyph);
    if (view) singles.push(view);
  }
  return singles;
}

function makeRadicalFallback(
  wordRadical: string | null | undefined
): RadicalFallback | null {
  const glyph = wordRadical?.trim();
  if (!glyph) return null;
  const labelMn = componentDisplayLabel(glyph) || null;
  return { glyph, labelMn };
}

/**
 * Rich char_breakdown.json views plus hsk_words.radical fallback for gaps.
 */
export function resolveWordBreakdownViews(
  text: string,
  wordRadical?: string | null
): CharBreakdownView[] {
  const zh = text.trim();
  if (!zh) return [];

  const rich = resolveBreakdownCharsForText(zh);
  const fallback = makeRadicalFallback(wordRadical);
  if (!fallback) return rich;

  if (rich.length === 1 && rich[0]!.char === zh) {
    return rich;
  }

  const chars = [...zh].filter((ch) => HANZI_RE.test(ch));
  const richByChar = new Map(rich.map((v) => [v.char, v]));
  const uncovered = chars.filter((ch) => !richByChar.has(ch));

  if (uncovered.length === 0) return rich;

  const result: CharBreakdownView[] = [...rich];

  if (uncovered.length === chars.length) {
    return [
      {
        char: zh,
        parts: [],
        structure: null,
        etymology_mn: null,
        radicalFallback: fallback,
      },
    ];
  }

  for (const ch of uncovered) {
    result.push({
      char: ch,
      parts: [],
      structure: null,
      etymology_mn: null,
      radicalFallback: fallback,
    });
  }

  return result;
}

function hasHandWrittenEntry(char: string): boolean {
  return getCharBreakdownEntry(char) != null;
}

function buildViewFromFullEntry(
  char: string,
  entry: import("@/lib/hanzi/char-breakdown-full").FullBreakdownEntry,
  getMn: (glyph: string) => string
): CharBreakdownView {
  const parts: DecompositionComponent[] = (entry.c ?? [])
    .filter((comp) => comp.ch?.trim())
    .map((comp) => {
      const glyph = comp.ch.trim();
      const name = comp.mn?.trim() || getMn(glyph) || "";
      return {
        c: glyph,
        name,
        icon: componentDisplayIcon(glyph),
      };
    });

  const radicalGlyph = entry.r?.trim();
  const radicalLine: RadicalLine | null = radicalGlyph
    ? {
        glyph: radicalGlyph,
        labelMn: entry.rmn?.trim() || getMn(radicalGlyph) || null,
      }
    : null;

  return {
    char,
    parts,
    structure: entry.s?.trim() || null,
    etymology_mn: entry.e?.trim() || null,
    etymologyRich: false,
    radicalLine,
  };
}

function viewHasContent(view: CharBreakdownView): boolean {
  return (
    view.parts.length > 0 ||
    Boolean(view.structure) ||
    Boolean(view.etymology_mn) ||
    Boolean(view.radicalLine) ||
    Boolean(view.radicalFallback)
  );
}

/**
 * Async resolve: hand-written (23) first, then char_breakdown_full per hanzi.
 * Returns [] when fetch fails (panel stays hidden).
 */
export async function resolveWordBreakdownViewsAsync(
  text: string,
  wordRadical?: string | null
): Promise<CharBreakdownView[]> {
  const zh = text.trim();
  if (!zh) return [];

  const {
    ensureCharBreakdownFullLoaded,
    getFullBreakdownEntry,
    getFullComponentMn,
  } = await import("@/lib/hanzi/char-breakdown-full");

  const loaded = await ensureCharBreakdownFullLoaded();
  if (!loaded) return [];

  const chars = [...zh].filter((ch) => HANZI_RE.test(ch));
  if (chars.length === 0) return [];

  if (hasHandWrittenEntry(zh)) {
    const fullHand = getCharBreakdownView(zh);
    if (fullHand) return [fullHand];
  }

  const views: CharBreakdownView[] = [];

  for (const ch of chars) {
    if (hasHandWrittenEntry(ch)) {
      const handView = getCharBreakdownView(ch);
      if (handView) {
        views.push(handView);
        continue;
      }
    }

    const fullEntry = getFullBreakdownEntry(ch);
    if (fullEntry) {
      const view = buildViewFromFullEntry(ch, fullEntry, getFullComponentMn);
      if (viewHasContent(view)) {
        views.push(view);
        continue;
      }
    }

    const fallback = makeRadicalFallback(wordRadical);
    if (fallback) {
      views.push({
        char: ch,
        parts: [],
        structure: null,
        etymology_mn: null,
        radicalFallback: fallback,
      });
    }
  }

  return views.filter(viewHasContent);
}
