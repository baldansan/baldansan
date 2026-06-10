import type { HskLevel } from "@/lib/hsk";

export function resolveCatalogLevel(raw: string | null): HskLevel {
  if (raw === "7-9" || raw === "7" || raw === "8" || raw === "9") return "7-9";
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= 6) {
    return String(n) as HskLevel;
  }
  return "1";
}

export function parseWordIdsParam(raw: string | null): number[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}
