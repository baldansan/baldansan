import {
  jsonDeckResponse,
  loadQuizWordPool,
} from "@/lib/games/game-deck-route";
import { buildWordRecallDeck } from "@/lib/games/hsk-quiz-builders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { words, level } = await loadQuizWordPool(request, 80);
    const deck = buildWordRecallDeck(words, 30);
    return jsonDeckResponse(deck, level, words.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
