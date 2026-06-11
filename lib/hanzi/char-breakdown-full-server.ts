import { readFile } from "fs/promises";
import path from "path";

export type ServerFullBreakdownComponent = {
  ch: string;
  mn?: string;
};

export type ServerFullBreakdownEntry = {
  s?: string;
  c?: ServerFullBreakdownComponent[];
  r?: string;
  rmn?: string;
  e?: string;
};

let fullDataCache: Record<string, ServerFullBreakdownEntry> | null = null;
let componentMnCache: Record<string, { mn?: string }> | null = null;
let loadPromise: Promise<boolean> | null = null;

export async function ensureServerBreakdownFullLoaded(): Promise<boolean> {
  if (fullDataCache && componentMnCache) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const base = path.join(process.cwd(), "public", "data");
      const [fullRaw, mnRaw] = await Promise.all([
        readFile(path.join(base, "char_breakdown_full.json"), "utf8"),
        readFile(path.join(base, "component_meanings_mn.json"), "utf8"),
      ]);
      fullDataCache = JSON.parse(fullRaw) as Record<
        string,
        ServerFullBreakdownEntry
      >;
      componentMnCache = JSON.parse(mnRaw) as Record<string, { mn?: string }>;
      return true;
    } catch {
      return false;
    }
  })();

  return loadPromise;
}

export function getServerFullBreakdownEntry(
  char: string
): ServerFullBreakdownEntry | null {
  if (!fullDataCache) return null;
  return fullDataCache[char.trim()] ?? null;
}

export function getServerFullComponentMn(glyph: string): string {
  const key = glyph.trim();
  if (!key || !componentMnCache) return "";
  return componentMnCache[key]?.mn?.trim() ?? "";
}
