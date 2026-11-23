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
    // ?limit=8 — нүүрний хурдан хайлт (dropdown) цөөн мөр авна.
    const limitRaw = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(MAX_RESULTS, Math.floor(limitRaw))
        : MAX_RESULTS;

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

    const top = results.slice(0, limit);

    // HSK-д байхгүй үгийг CC-CEDICT лексиконоос нөхнө (id < 0 = лексикон).
    if (top.length < limit) {
      const lex = await searchLexicon(supabase, q, limit - top.length, new Set(top.map((w) => w.simplified)));
      top.push(...lex);
    }

    return Response.json({ query: q, results: top });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Хайлтад алдаа гарлаа";
    return Response.json({ error: message }, { status: 500 });
  }
}

type LexRow = {
  id: number; simplified: string; traditional: string | null; pinyin: string;
  english: string; kind: string; meaning_mn: string | null; mn_status: string;
};

const LEX_SELECT = "id, simplified, traditional, pinyin, english, kind, meaning_mn, mn_status";

/** «a; b / c» маягийн утгыг хэсэг болгож, хайлттай яг таарч буйг эхэнд гаргана. */
function matchRank(text: string | null, q: string, plainEn: boolean): number {
  if (!text) return 3;
  const t = text.toLowerCase();
  const segs = t.split(/\s*[;/]\s*/);
  for (const sg of segs) {
    const x = plainEn ? sg.replace(/^(to|a|an|the)\s+/, "").replace(/\s*\(.*?\)\s*/g, "") : sg;
    if (x === q || sg === q) return 0;
  }
  if (segs.some((sg) => sg.startsWith(q))) return 1;
  if (new RegExp(`(^|[^\\p{L}])${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(t)) return 2;
  return 3;
}

async function searchLexicon(
  supabase: NonNullable<ReturnType<typeof searchClient>>,
  q: string,
  room: number,
  skip: Set<string>
) {
  try {
    const lq = q.toLowerCase();
    const col = () => supabase.from("dictionary_lexicon").select(LEX_SELECT);
    const tasks: PromiseLike<{ data: LexRow[] | null }>[] = [];
    let rankOf: (r: LexRow) => number;

    if (HAS_CJK.test(q)) {
      tasks.push(col().eq("simplified", q).limit(10));
      tasks.push(col().ilike("simplified", `${q}%`).limit(60));
      tasks.push(col().ilike("simplified", `%${q}%`).limit(60));
      rankOf = (r) => (r.simplified === q ? 0 : r.simplified.startsWith(q) ? 1 : 2);
    } else if (HAS_CYRILLIC.test(q)) {
      tasks.push(col().ilike("meaning_mn", q).limit(30));
      tasks.push(col().ilike("meaning_mn", `${q}; %`).limit(30));
      tasks.push(col().ilike("meaning_mn", `%; ${q}`).limit(30));
      tasks.push(col().ilike("meaning_mn", `%; ${q}; %`).limit(30));
      tasks.push(col().ilike("meaning_mn", `${q}%`).limit(40));
      tasks.push(col().ilike("meaning_mn", `%${q}%`).limit(60));
      rankOf = (r) => matchRank(r.meaning_mn, lq, false);
    } else {
      // Латин: англи утга ЭСВЭЛ пиньинь (тон тэмдэгтэй / тоотой / тоногүй)
      const plain = lq
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9üv]/g, "");
      const hasTone = /[1-5]/.test(plain);
      const pq = plain.replace(/v/g, "ü");
      if (plain) {
        if (hasTone) {
          const spaced = lq.replace(/(\d)(?=[a-z])/g, "$1 ").trim();
          tasks.push(col().ilike("pinyin_num", `${spaced}%`).limit(40));
        } else {
          tasks.push(col().eq("pinyin_plain", plain).limit(30));
          if (pq !== plain) tasks.push(col().eq("pinyin_plain", pq).limit(30));
          tasks.push(col().ilike("pinyin_plain", `${plain}%`).limit(40));
        }
      }
      tasks.push(col().ilike("pinyin", `${lq}%`).limit(30));
      tasks.push(col().ilike("english", q).limit(30));
      tasks.push(col().ilike("english", `to ${q}`).limit(30));
      tasks.push(col().ilike("english", `${q} / %`).limit(30));
      tasks.push(col().ilike("english", `to ${q} / %`).limit(30));
      tasks.push(col().ilike("english", `% / ${q}`).limit(30));
      tasks.push(col().ilike("english", `% / ${q} / %`).limit(30));
      tasks.push(col().ilike("english", `%${q}%`).limit(60));
      rankOf = (r) => {
        const py = (r.pinyin ?? "").toLowerCase();
        const pp = py.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zü]/g, "");
        if (plain && !hasTone && (pp === plain || pp === pq)) return 0;
        if (py === lq) return 0;
        return matchRank(r.english, lq, true);
      };
    }

    const parts = await Promise.all(tasks);
    const seen = new Set<number>();
    const rows: LexRow[] = [];
    for (const part of parts) for (const r of part.data ?? []) if (!seen.has(r.id)) { seen.add(r.id); rows.push(r); }
    const score = (r: LexRow) =>
      rankOf(r) * 10 + (r.kind === "word" ? 0 : 5) + Math.min(r.simplified.length, 9) / 10;
    rows.sort((a, b) => score(a) - score(b));
    return rows
      .filter((r) => !skip.has(r.simplified))
      .slice(0, room)
      .map((r) => ({
        id: -r.id,
        simplified: r.simplified,
        traditional: r.traditional,
        pinyin: r.pinyin,
        pos: null,
        radical: null,
        frequency: null,
        hsk_level: null,
        hsk_old: null,
        meaning_en: r.english,
        meaning_mn: r.meaning_mn,
        example_zh: null,
        example_pinyin: null,
        example_mn: null,
        lexicon: true,
      }));
  } catch {
    return [];
  }
}
