import { resolveCatalogLevel } from "@/lib/games/game-api-level";
import { fetchMemorizeMeta } from "@/lib/hsk/memorize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = resolveCatalogLevel(searchParams.get("level"));
    const meta = await fetchMemorizeMeta(level);
    return Response.json({ level, ...meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
