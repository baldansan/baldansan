import { resolveCatalogLevel } from "@/lib/games/game-api-level";
import { fetchMemorizeBatch } from "@/lib/hsk/memorize";
import type { PosCategoryId } from "@/lib/hsk/pos-catalog";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set<PosCategoryId>([
  "all",
  "n",
  "v",
  "a",
  "d",
  "m",
  "r",
  "p",
  "c",
  "other",
]);

function parseCategory(raw: string | null): PosCategoryId {
  const id = (raw ?? "all").trim() as PosCategoryId;
  return VALID_CATEGORIES.has(id) ? id : "all";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = resolveCatalogLevel(searchParams.get("level"));
    const category = parseCategory(searchParams.get("category"));
    const batch = Math.max(0, Number(searchParams.get("batch") ?? "0") || 0);
    const payload = await fetchMemorizeBatch(level, category, batch);
    return Response.json({ level, category, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
