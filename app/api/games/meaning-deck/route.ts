import { NextResponse } from "next/server";
import {
  parseWordIdsFromSearchParams,
  resolveCatalogLevel,
} from "@/lib/games/game-api-level";
import { buildMeaningQuizDeck } from "@/lib/games/meaning-quiz";
import { buildPracticeMeaningDeck } from "@/lib/review/practice-decks";
import { getQuizWordPool, getWordsByIds } from "@/lib/hsk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const levelParam = searchParams.get("level");
    const wordIds = parseWordIdsFromSearchParams(searchParams);
    const size = Math.min(
      25,
      Math.max(5, Number(searchParams.get("size") ?? 15) || 15)
    );

    const catalogLevel = resolveCatalogLevel(levelParam);

    if (wordIds.length > 0) {
      const words = await getWordsByIds(wordIds);
      const deck = buildPracticeMeaningDeck(words);
      if (!deck.length) {
        return NextResponse.json(
          { error: "Асуулт бүрдэж чадсангүй." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        deck,
        level: catalogLevel,
        poolSize: words.length,
        customWordIds: true,
      });
    }

    const words = await getQuizWordPool(catalogLevel, 120);
    if (words.length < 4) {
      return NextResponse.json(
        { error: "Энэ түвшинд хангалттай үг байхгүй." },
        { status: 400 }
      );
    }

    const deck = buildMeaningQuizDeck(words, size);
    if (deck.length === 0) {
      return NextResponse.json(
        { error: "Асуулт бүрдэж чадсангүй." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      deck,
      level: catalogLevel,
      poolSize: words.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
