import { createClient } from "@supabase/supabase-js";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const WORD_SELECT =
  "id, simplified, traditional, pinyin, pos, radical, frequency, hsk_level, hsk_old, meaning_en, meaning_mn, example_zh, example_pinyin, example_mn";

const MAX_RESULTS = 30;

function searchClient() {
  if (!hasServerSupabaseConfig) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** PostgREST .or() breaks on commas/parens — strip them plus wildcards. */
function sanitizeQuery(raw: string): string {
  return raw.replace(/[,()%_*\\]/g, " ").replace(/\s+/g, " ").trim();
}

const HAS_CJK = /[㐀-鿿豈-﫿]/;
const HAS_CYRILLIC = /[Ѐ-ӿ]/;

/** Build the .or() filter based on the script of the query. */
function buildOrFilter(q: string): string {
  const like = `%${q}%`;
  if (HAS_CJK.test(q)) {
    return [
      `simplified.ilike.${like}`,
      `traditional.ilike.${like}`,
      `example_zh.ilike.${like}`,
    ].join(",");
  }
  if (HAS_CYRILLIC.test(q)) {
    return [`meaning_mn.ilike.${like}`].join(",");
  }
  // Latin: pinyin (with tone marks), toneless sort key, English meaning
  return [
    `pinyin.ilike.${like}`,
    `pinyin_sort_key.ilike.${like}`,
    `meaning_en.ilike.${like}`,
  ].join(",");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = sanitizeQuery(searchParams.get("q") ?? "");
    const radical = sanitizeQuery(searchParams.get("radical") ?? "");

    if (q.length < 1 && radical.length < 1) {
      return Response.json({ query: q, results: [] });
    }

    const supabase = searchClient();
    if (!supabase) {
      return Response.json(
        { error: "Supabase тохиргоо байхгүй." },
        { status: 503 }
      );
    }

    // Язгуураар үзэх горим: ?radical=氵 — тухайн язгууртай үгс
    if (radical.length >= 1 && q.length < 1) {
      const { data, error } = await supabase
        .from("hsk_words")
        .select(WORD_SELECT)
        .eq("radical", radical)
        .order("frequency", { ascending: true, nullsFirst: false })
        .limit(60);
      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ query: "", radical, results: data ?? [] });
    }

    const { data, error } = await supabase
      .from("hsk_words")
      .select(WORD_SELECT)
      .or(buildOrFilter(q))
      .order("frequency", { ascending: true, nullsFirst: false })
      .limit(MAX_RESULTS);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const results = data ?? [];

    // Exact matches first (simplified / toneless pinyin / meaning word)
    const lower = q.toLowerCase();
    results.sort((a, b) => {
      const exactA =
        a.simplified === q || (a.pinyin ?? "").toLowerCase() === lower ? 0 : 1;
      const exactB =
        b.simplified === q || (b.pinyin ?? "").toLowerCase() === lower ? 0 : 1;
      if (exactA !== exactB) return exactA - exactB;
      return (a.frequency ?? 999999) - (b.frequency ?? 999999);
    });

    return Response.json({ query: q, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Хайлтад алдаа гарлаа";
    return Response.json({ error: message }, { status: 500 });
  }
}
