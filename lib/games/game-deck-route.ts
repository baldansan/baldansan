import { NextResponse } from "next/server";
import {
  parseWordIdsFromSearchParams,
  resolveCatalogLevel,
} from "@/lib/games/game-api-level";

const MAX_CUSTOM_WORD_IDS = 200;
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
): Promise<{ words: HskWord[]; level: HskLevel; customWordIds: boolean }> {
  const { searchParams } = new URL(request.url);
  const level = resolveCatalogLevel(searchParams.get("level"));
  const wordIds = parseWordIdsFromSearchParams(searchParams);

  if (wordIds.length > MAX_CUSTOM_WORD_IDS) {
    throw new Error(`wordIds хэт их (хамгийн ихдээ ${MAX_CUSTOM_WORD_IDS}).`);
  }

  if (wordIds.length > 0) {
    const words = await getWordsByIds(wordIds);
    if (words.length > 0) {
      return { words, level, customWordIds: true };
    }
  }

  const words = await getQuizWordPool(level, poolSize);
  return { words, level, customWordIds: false };
}

export function jsonDeckResponse(
  deck: HskQuizQuestion[],
  level: HskLevel,
  poolSize: number,
  extra?: Record<string, unknown>,
  minDeckSize = 4
) {
  if (deck.length < minDeckSize) {
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
