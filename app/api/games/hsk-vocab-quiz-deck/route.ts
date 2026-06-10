import {
  jsonDeckResponse,
  loadQuizWordPool,
} from "@/lib/games/game-deck-route";
import {
  buildHskVocabQuizDeck,
  getVocabQuizConfig,
} from "@/lib/games/hsk-vocab-quiz";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get("level");
    const { words, level } = await loadQuizWordPool(request, 300);
    const config = getVocabQuizConfig(level);
    const deck = buildHskVocabQuizDeck(words, level);

    if (deck.length < Math.min(10, config.questions)) {
      return Response.json(
        { error: "Энэ түвшинд дасгал үүсгэхэд хангалттай үг алга." },
        { status: 500 }
      );
    }

    return jsonDeckResponse(deck, level, words.length, {
      config,
      requestedLevel: levelParam,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
