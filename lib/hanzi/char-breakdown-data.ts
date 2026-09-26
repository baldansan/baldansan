import charBreakdownData from "@/data/char_breakdown.json";
import componentMeaningsData from "@/data/component_meanings.json";
import { resolveComponentIcon } from "@/lib/hanzi/component-icon-map";
import type { DecompositionComponent } from "@/lib/hanzi/character-decomposition";
import type {
  FullBreakdownEntry,
  FullBreakdownType,
} from "@/lib/hanzi/char-breakdown-full";

export type ComponentMeaning = {
  mn: string;
  en: string;
  icon: string;
};

/**
 * data/char_breakdown.json — 23 hand-written mnemonic sentences only.
 * Parts/structure ALWAYS come from the dataset (char_breakdown_full.json);
 * `components` is kept optional for backward compatibility and is empty.
 */
export type CharBreakdownEntry = {
  components?: string[];
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
  labelZh?: string | null;
};

export type CharBreakdownView = {
  char: string;
  parts: DecompositionComponent[];
  /** Structure label (mn). */
  structure: string | null;
  /** Structure label (zh), e.g. 左右结构. */
  structureZh?: string | null;
  /** 形声 / 会意 / 象形. */
  type?: FullBreakdownType | null;
  /** Explanation (mn) — dataset `e`. */
  etymology_mn: string | null;
  /** Explanation (zh) — dataset `ez`. */
  explanationZh?: string | null;
  /** Hand-written etymology vs catalog description styling. */
  etymologyRich?: boolean;
  /** Optional hand-written mnemonic sentence (data/char_breakdown.json). */
  mnemonic_mn?: string | null;
  /** Dataset marks the decomposition incomplete. */
  incomplete?: boolean;
  /** From char_breakdown_full r/rmn/rz. */
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

/** Hand-written mnemonic sentence (data/char_breakdown.json) — optional extra. */
function handMnemonic(char: string): string | null {
  return getCharBreakdownEntry(char)?.etymology_mn?.trim() || null;
}

type FullLookups = {
  getMn: (glyph: string) => string;
  getZh?: (glyph: string) => string;
};

function mapPartKind(
  k: string | undefined
): DecompositionComponent["kind"] {
  if (k === "radical" || k === "stroke" || k === "other") return k;
  return "char";
}

/**
 * Dataset entry (char_breakdown_full.json, makemeahanzi) → view. The dataset
 * is the single source for parts, structure, radical and explanation.
 */
export function buildViewFromFullEntry(
  char: string,
  entry: FullBreakdownEntry,
  lookups: FullLookups | ((glyph: string) => string)
): CharBreakdownView {
  const getMn = typeof lookups === "function" ? lookups : lookups.getMn;
  const getZh =
    typeof lookups === "function" ? () => "" : (lookups.getZh ?? (() => ""));

  const labelMn = (glyph: string) =>
    getMn(glyph) || componentDisplayLabel(glyph) || "";

  const parts: DecompositionComponent[] = (entry.c ?? [])
    .filter((comp) => comp.ch?.trim())
    .map((comp) => {
      const glyph = comp.ch.trim();
      const subGlyphs = entry.sub?.[glyph] ?? [];
      return {
        c: glyph,
        name: comp.mn?.trim() || labelMn(glyph),
        nameZh: comp.zh?.trim() || getZh(glyph) || undefined,
        icon: componentDisplayIcon(glyph),
        role: comp.role,
        kind: mapPartKind(comp.k),
        py: comp.py?.trim() || undefined,
        sub:
          subGlyphs.length > 0
            ? subGlyphs.map((g) => ({
                c: g,
                name: labelMn(g),
                nameZh: getZh(g) || undefined,
                icon: componentDisplayIcon(g),
              }))
            : undefined,
      };
    });

  const radicalGlyph = entry.r?.trim();
  const radicalLine: RadicalLine | null = radicalGlyph
    ? {
        glyph: radicalGlyph,
        labelMn: entry.rmn?.trim() || labelMn(radicalGlyph) || null,
        labelZh: entry.rz?.trim() || getZh(radicalGlyph) || null,
      }
    : null;

  return {
    char,
    parts,
    structure: entry.s?.trim() || null,
    structureZh: entry.sz?.trim() || null,
    type: entry.t ?? null,
    etymology_mn: entry.e?.trim() || null,
    explanationZh: entry.ez?.trim() || null,
    etymologyRich: false,
    mnemonic_mn: handMnemonic(char),
    incomplete: entry.inc === true,
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
 * One character's view from the dataset (loads the public JSON once per
 * session). Null when the fetch fails or the char has nothing to show.
 */
export async function loadFullCharBreakdownView(
  char: string
): Promise<CharBreakdownView | null> {
  const glyph = char.trim();
  if (!glyph || !HANZI_RE.test(glyph)) return null;
  const {
    ensureCharBreakdownFullLoaded,
    getFullBreakdownEntry,
    getFullComponentMn,
    getFullComponentZh,
  } = await import("@/lib/hanzi/char-breakdown-full");
  const loaded = await ensureCharBreakdownFullLoaded();
  if (!loaded) return null;
  const entry = getFullBreakdownEntry(glyph);
  if (!entry) return null;
  const view = buildViewFromFullEntry(glyph, entry, {
    getMn: getFullComponentMn,
    getZh: getFullComponentZh,
  });
  return viewHasContent(view) ? view : null;
}

/**
 * Async resolve: every hanzi from char_breakdown_full (dataset), then
 * hsk_words.radical fallback for chars the dataset does not cover.
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
    getFullComponentZh,
  } = await import("@/lib/hanzi/char-breakdown-full");

  const loaded = await ensureCharBreakdownFullLoaded();
  if (!loaded) return [];

  const chars = [...new Set([...zh].filter((ch) => HANZI_RE.test(ch)))];
  if (chars.length === 0) return [];

  const views: CharBreakdownView[] = [];

  for (const ch of chars) {
    const fullEntry = getFullBreakdownEntry(ch);
    if (fullEntry) {
      const view = buildViewFromFullEntry(ch, fullEntry, {
        getMn: getFullComponentMn,
        getZh: getFullComponentZh,
      });
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
