import { NextResponse } from "next/server";
import { guardGamesDeckRoute } from "@/lib/api/game-route-guard";
import { loadQuizWordPool } from "@/lib/games/game-deck-route";
import {
  buildDictationDeck,
  DICTATION_QUESTIONS,
} from "@/lib/games/dictation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = guardGamesDeckRoute(request);
  if (rateLimited) return rateLimited;

  try {
    const { words, level } = await loadQuizWordPool(request, 150);
    const deck = buildDictationDeck(words, DICTATION_QUESTIONS);

    if (deck.length < 4) {
      return NextResponse.json(
        { error: "Энэ түвшинд диктант бүрдүүлэхэд хангалттай үг алга." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { deck, level },
      {
        headers: {
          "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    const status = message.includes("wordIds") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
