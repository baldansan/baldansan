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

export type CharBreakdownView = {
  char: string;
  parts: DecompositionComponent[];
  structure: string | null;
  etymology_mn: string | null;
};

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
    };
  }

  const parts = buildDecompositionParts(entry.components, {
    includeUnknown: true,
  });
  const etymology = entry.etymology_mn?.trim() || null;
  const structure = entry.structure?.trim() || null;
  if (parts.length === 0 && !etymology && !structure) return null;

  return { char, parts, structure, etymology_mn: etymology };
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
