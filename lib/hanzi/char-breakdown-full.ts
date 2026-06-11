const FULL_DATA_URL = "/data/char_breakdown_full.json";
const COMPONENT_MN_URL = "/data/component_meanings_mn.json";

export type FullBreakdownComponent = {
  ch: string;
  mn?: string;
};

export type FullBreakdownEntry = {
  s?: string;
  c?: FullBreakdownComponent[];
  r?: string;
  rmn?: string;
  e?: string;
};

let fullDataCache: Record<string, FullBreakdownEntry> | null = null;
let componentMnCache: Record<string, { mn?: string }> | null = null;
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
      if (!fullRes.ok || !mnRes.ok) return false;
      fullDataCache = (await fullRes.json()) as Record<
        string,
        FullBreakdownEntry
      >;
      componentMnCache = (await mnRes.json()) as Record<
        string,
        { mn?: string }
      >;
      return true;
    } catch {
      return false;
    }
  })();

  return loadPromise;
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
