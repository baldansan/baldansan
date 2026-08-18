import { resolveCatalogLevel } from "@/lib/games/game-api-level";
import {
  fetchMemorizeBatchSummaries,
  fetchMemorizeThemeSummaries,
} from "@/lib/hsk/memorize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = resolveCatalogLevel(searchParams.get("level"));

    // Сэдэвчилсэн бүлгүүд байвал тэднийг буцаана
    const themed = await fetchMemorizeThemeSummaries(level);
    if (themed) {
      return Response.json({
        level,
        mode: "themes",
        batches: themed.groups,
        totalWords: themed.totalWords,
      });
    }

    // Fallback: хуучин пиньинь дарааллын багцууд
    const payload = await fetchMemorizeBatchSummaries(level);
    return Response.json({ level, mode: "pinyin", ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
