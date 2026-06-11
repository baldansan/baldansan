import {
  jsonDeckResponse,
  loadQuizWordPool,
} from "@/lib/games/game-deck-route";
import {
  buildRadicalPickDeck,
  expandQuizDeck,
} from "@/lib/games/hsk-quiz-builders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { words, level, customWordIds } = await loadQuizWordPool(
      request,
      150
    );
    let deck = buildRadicalPickDeck(words, 15);
    if (customWordIds) {
      deck = expandQuizDeck(deck);
    }
    return jsonDeckResponse(
      deck,
      level,
      words.length,
      undefined,
      customWordIds ? 1 : 4
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
