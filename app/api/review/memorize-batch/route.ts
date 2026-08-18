import { resolveCatalogLevel } from "@/lib/games/game-api-level";
import {
  fetchMemorizeBatch,
  fetchMemorizeThemeGroup,
} from "@/lib/hsk/memorize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = resolveCatalogLevel(searchParams.get("level"));

    // Шинэ: сэдэвчилсэн бүлэг (?group=<groupId>)
    const group = searchParams.get("group");
    if (group) {
      const payload = await fetchMemorizeThemeGroup(level, group);
      if (!payload) {
        return Response.json({ error: "Бүлэг олдсонгүй" }, { status: 404 });
      }
      return Response.json({ level, ...payload });
    }

    // Хуучин: пиньинь дарааллын багц (?batch=N)
    const batch = Math.max(0, Number(searchParams.get("batch") ?? "0") || 0);
    const payload = await fetchMemorizeBatch(level, batch);
    return Response.json({ level, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
