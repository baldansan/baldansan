import { guardGamesDeckRoute } from "@/lib/api/game-route-guard";
import {
  jsonDeckResponse,
  loadQuizWordPool,
} from "@/lib/games/game-deck-route";
import { buildSrsMarathonDeck } from "@/lib/games/hsk-quiz-builders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = guardGamesDeckRoute(request);
  if (rateLimited) return rateLimited;

  try {
    const { words, level } = await loadQuizWordPool(request, 120);
    const deck = buildSrsMarathonDeck(words, 15);
    return jsonDeckResponse(deck, level, words.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
