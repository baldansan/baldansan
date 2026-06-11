import { NextResponse } from "next/server";
import { parseWordIdsFromSearchParams } from "@/lib/games/game-api-level";
import { buildRadicalEntriesFromWords } from "@/lib/games/radical-entries-from-words";
import { getWordsByIds } from "@/lib/hsk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wordIds = parseWordIdsFromSearchParams(searchParams);

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
