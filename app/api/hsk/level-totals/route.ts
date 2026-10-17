import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createAnonServerSupabaseClient } from "@/lib/supabase/server";

/**
 * HSK түвшин бүрийн үгийн тоо (is_function_word=false).
 *
 * Өмнө нь browser бүр /home, /review, /profile дээр 6 HEAD count query
 * (заримдаа 2 удаа = 12) Supabase руу шууд явуулдаг байв. Тоо нь бараг
 * өөрчлөгддөггүй тул серверт 1 удаа тоолоод Data Cache-д 1 хоног хадгална;
 * клиент нэг л GET хийнэ.
 */
const LEVELS = ["1", "2", "3", "4", "5", "6"] as const;

const getLevelTotalsCached = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const client = createAnonServerSupabaseClient();
    if (!client) throw new Error("supabase not configured");
    const entries = await Promise.all(
      LEVELS.map(async (level) => {
        const { count, error } = await client
          .from("hsk_words")
          .select("id", { count: "exact", head: true })
          .eq("hsk_level", level)
          .eq("is_function_word", false);
        if (error) throw error;
        return [level, count ?? 0] as const;
      })
    );
    return Object.fromEntries(entries);
  },
  ["hsk-level-totals"],
  { revalidate: 60 * 60 * 24, tags: ["hsk-level-totals"] }
);

export async function GET() {
  try {
    const totals = await getLevelTotalsCached();
    return NextResponse.json(
      { totals },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { totals: null, error: error instanceof Error ? error.message : "failed" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
