import { guardGamesDeckRoute } from "@/lib/api/game-route-guard";
import {
  jsonDeckResponse,
  loadQuizWordPool,
} from "@/lib/games/game-deck-route";
import { parseQuizTypesParam } from "@/lib/games/hsk-quiz-presets";
import {
  buildHskVocabQuizDeck,
  getVocabQuizConfig,
} from "@/lib/games/hsk-vocab-quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = guardGamesDeckRoute(request);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get("level");
    const kinds = parseQuizTypesParam(searchParams.get("types"));
    const { words, level, customWordIds } = await loadQuizWordPool(request, 300);
    const config = getVocabQuizConfig(level);
    const deck = buildHskVocabQuizDeck(words, level, kinds ?? undefined);

    if (deck.length < Math.min(10, config.questions)) {
      return Response.json(
        { error: "Энэ түвшинд дасгал үүсгэхэд хангалттай үг алга." },
        { status: 500 }
      );
    }

    return jsonDeckResponse(deck, level, words.length, {
      config,
      requestedLevel: levelParam,
      presetTypes: kinds,
      customWordIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    const status = message.includes("wordIds") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
