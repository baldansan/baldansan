import { NextResponse } from "next/server";
import {
  parseWordIdsParam,
  resolveCatalogLevel,
} from "@/lib/games/game-api-level";
import type { HskQuizQuestion } from "@/lib/games/hsk-quiz-builders";
import {
  getQuizWordPool,
  getWordsByIds,
  type HskLevel,
  type HskWord,
} from "@/lib/hsk";

export async function loadQuizWordPool(
  request: Request,
  poolSize = 120
): Promise<{ words: HskWord[]; level: HskLevel }> {
  const { searchParams } = new URL(request.url);
  const level = resolveCatalogLevel(searchParams.get("level"));
  const wordIds = parseWordIdsParam(searchParams.get("wordIds"));

  if (wordIds.length >= 4) {
    const words = await getWordsByIds(wordIds);
    if (words.length >= 4) {
      return { words, level };
    }
  }

  const words = await getQuizWordPool(level, poolSize);
  return { words, level };
}

export function jsonDeckResponse(
  deck: HskQuizQuestion[],
  level: HskLevel,
  poolSize: number,
  extra?: Record<string, unknown>
) {
  if (deck.length < 4) {
    return NextResponse.json(
      { error: "Энэ түвшинд хангалттай асуулт бүрдэж чадсангүй." },
      { status: 400 }
    );
  }
  return NextResponse.json(
    {
      deck,
      level,
      poolSize,
      ...extra,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
