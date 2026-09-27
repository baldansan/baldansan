/**
 * «Үе давах» — үеийн үгийн багц.
 * GET /api/games/level-deck?game=arrange|match|translate|missing-word&level=N
 * → { level, meta, items: GameVocabItem[] }
 *
 * Эх: data/hsk_words.json (fs, процессын санах ойд нэг удаа). Түвшний үгсийг
 * `frequency`-ээр (null сүүлд) эрэмбэлж, үе бүрт нэг цонх авна; үеийн дугаараар
 * seed-лэсэн тул дахин тоглоход ижил харагдана. Шалгалтын үе: тухайн түвшний
 * өнөөг хүртэлх бүх цонхноос 8 үг (seed-тэй) түүнэ.
 */
import { NextResponse } from "next/server";
import { guardGamesDeckRoute } from "@/lib/api/game-route-guard";
import { isLevelGame, levelMeta } from "@/lib/games/level-core";
import { buildLevelDeck, loadWordsByBand } from "@/lib/games/level-deck";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = guardGamesDeckRoute(request);
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") ?? "";
  const levelRaw = Number(searchParams.get("level") ?? "1");

  if (!isLevelGame(game)) {
    return NextResponse.json(
      { error: "game нь arrange | match | translate | missing-word байх ёстой." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(levelRaw) || levelRaw < 1) {
    return NextResponse.json({ error: "level нь 1-ээс эхэлсэн бүхэл тоо байх ёстой." }, { status: 400 });
  }

  try {
    const meta = levelMeta(levelRaw);
    const byBand = await loadWordsByBand();
    const bandWords = byBand.get(meta.hskLevel) ?? [];
    const items = buildLevelDeck(bandWords, game, meta.level);

    if (items.length < 4) {
      return NextResponse.json(
        { error: "Энэ үед хангалттай үг бүрдсэнгүй." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { level: meta.level, meta, items },
      {
        headers: {
          "Cache-Control": "private, max-age=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
