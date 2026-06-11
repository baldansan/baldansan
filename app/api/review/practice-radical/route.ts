import { guardReviewPracticeRoute } from "@/lib/api/game-route-guard";
import { NextResponse } from "next/server";
import { parseWordIdsFromSearchParams } from "@/lib/games/game-api-level";

const MAX_WORD_IDS = 200;
import { buildRadicalEntriesFromWords } from "@/lib/games/radical-entries-from-words";
import { getWordsByIds } from "@/lib/hsk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = guardReviewPracticeRoute(request);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const wordIds = parseWordIdsFromSearchParams(searchParams);

    if (wordIds.length > MAX_WORD_IDS) {
      return NextResponse.json(
        { error: `wordIds хэт их (хамгийн ихдээ ${MAX_WORD_IDS}).` },
        { status: 400 }
      );
    }

    if (!wordIds.length) {
      return NextResponse.json(
        { error: "Үг сонгоогүй байна." },
        { status: 400 }
      );
    }

    const words = await getWordsByIds(wordIds);
    if (!words.length) {
      return NextResponse.json(
        { error: "Үг олдсонгүй." },
        { status: 404 }
      );
    }

    const entries = await buildRadicalEntriesFromWords(words);
    return NextResponse.json({ entries, wordCount: words.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ачаалахад алдаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
