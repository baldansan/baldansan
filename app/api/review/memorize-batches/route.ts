import { resolveCatalogLevel } from "@/lib/games/game-api-level";
import { fetchMemorizeBatchSummaries } from "@/lib/hsk/memorize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = resolveCatalogLevel(searchParams.get("level"));
    const payload = await fetchMemorizeBatchSummaries(level);
    return Response.json({ level, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
