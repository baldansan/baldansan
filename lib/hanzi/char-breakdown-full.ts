const FULL_DATA_URL = "/data/char_breakdown_full.json";
const COMPONENT_MN_URL = "/data/component_meanings_mn.json";

/** Part kind in the dataset; absent = ordinary character. */
export type FullBreakdownComponentKind = "radical" | "stroke" | "other";

/** 形声 (утга-дуудлагын), 会意 (утга нийлсэн), 象形 (зураг). */
export type FullBreakdownType = "形声" | "会意" | "象形";

export type FullBreakdownComponent = {
  ch: string;
  /** Mongolian meaning (may be missing). */
  mn?: string;
  /** Chinese name/meaning, e.g. 言字旁 (may be missing). */
  zh?: string;
  k?: FullBreakdownComponentKind;
  /** sem = утга заагч / 形旁, pho = дуудлага заагч / 声旁. */
  role?: "sem" | "pho";
  /** Pinyin of the phonetic part. */
  py?: string;
};

/**
 * public/data/char_breakdown_full.json entry — built from makemeahanzi by
 * scripts/hanzi/build-char-breakdown.py (do not hand-edit).
 */
export type FullBreakdownEntry = {
  /** Structure label (mn), e.g. "зүүн–баруун". */
  s?: string;
  /** Structure label (zh), e.g. "左右结构". */
  sz?: string;
  /** IDS string, e.g. "⿰讠射". */
  ids?: string;
  t?: FullBreakdownType;
  /** First-level parts in order. */
  c?: FullBreakdownComponent[];
  /** Radical (部首) + names. */
  r?: string;
  rmn?: string;
  rz?: string;
  /** Explanation mn / zh. */
  e?: string;
  ez?: string;
  /** Decomposition incomplete (unknown part). */
  inc?: boolean;
  /** Second-level decomposition of a part. */
  sub?: Record<string, string[]>;
};

export type FullComponentMeaning = {
  mn?: string;
  zh?: string;
  k?: string;
};

let fullDataCache: Record<string, FullBreakdownEntry> | null = null;
let componentMnCache: Record<string, FullComponentMeaning> | null = null;
let loadPromise: Promise<boolean> | null = null;

/** Fetch public JSON once per session; returns false on failure (no throw). */
export function ensureCharBreakdownFullLoaded(): Promise<boolean> {
  if (fullDataCache && componentMnCache) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const [fullRes, mnRes] = await Promise.all([
        fetch(FULL_DATA_URL),
        fetch(COMPONENT_MN_URL),
      ]);
      if (!fullRes.ok || !mnRes.ok) {
        loadPromise = null;
        return false;
      }
      fullDataCache = (await fullRes.json()) as Record<
        string,
        FullBreakdownEntry
      >;
      componentMnCache = (await mnRes.json()) as Record<
        string,
        FullComponentMeaning
      >;
      return true;
    } catch {
      loadPromise = null;
      return false;
    }
  })();

  return loadPromise;
}

export function isCharBreakdownFullLoaded(): boolean {
  return Boolean(fullDataCache && componentMnCache);
}

export function getFullBreakdownEntry(
  char: string
): FullBreakdownEntry | null {
  if (!fullDataCache) return null;
  return fullDataCache[char.trim()] ?? null;
}

export function getFullComponentMn(glyph: string): string {
  const key = glyph.trim();
  if (!key || !componentMnCache) return "";
  return componentMnCache[key]?.mn?.trim() ?? "";
}

export function getFullComponentZh(glyph: string): string {
  const key = glyph.trim();
  if (!key || !componentMnCache) return "";
  return componentMnCache[key]?.zh?.trim() ?? "";
}

/** Glyph kind from component_meanings_mn.json ("radical" | "stroke" | "char" | …). */
export function getFullComponentKind(glyph: string): string {
  const key = glyph.trim();
  if (!key || !componentMnCache) return "";
  return componentMnCache[key]?.k?.trim() ?? "";
}

export const HANZI_DECOMPOSITION_ATTRIBUTION =
  "Ханзны задаргааны өгөгдөл: makemeahanzi (skishore), Unihan / CC-CEDICT / Wiktionary — CC BY-SA";
