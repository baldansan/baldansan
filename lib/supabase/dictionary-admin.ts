import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  DictEntry,
  DictSense,
  DictStatus,
  DictWordFull,
  DictWordHead,
} from "@/lib/dictionary/types";

export type DictLevelCounts = {
  hsk_level: string;
  total: number;
  draft: number;
  reviewed: number;
  approved: number;
  none: number;
};

export async function getDictionaryCounts(): Promise<DictLevelCounts[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.rpc("dictionary_status_counts");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    hsk_level: String(r.hsk_level),
    total: Number(r.total ?? 0),
    draft: Number(r.draft ?? 0),
    reviewed: Number(r.reviewed ?? 0),
    approved: Number(r.approved ?? 0),
    none: Number(r.none ?? 0),
  }));
}

export type DictQueueRow = DictWordHead & {
  status: DictStatus | null;
  sense_count: number;
};

/**
 * Хянах дараалал: тухайн түвшний үгс, статусаар шүүсэн. «none» = толийн бичилт огт байхгүй.
 */
export async function getDictionaryQueue(opts: {
  level: string;
  status: DictStatus | "none" | "all";
  limit?: number;
  q?: string;
}): Promise<DictQueueRow[]> {
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const limit = opts.limit ?? 120;

  let wordQuery = client
    .from("hsk_words")
    .select("id, simplified, traditional, pinyin, pos, hsk_level, frequency, meaning_en, meaning_mn, example_zh, example_mn")
    .eq("hsk_level", opts.level)
    .order("frequency", { ascending: true, nullsFirst: false });
  if (opts.q?.trim()) {
    // PostgREST .or() шүүлтийг эвдэх тэмдэгтүүдийг хасна.
    const q = opts.q.trim().replace(/[,()%*\\]/g, "");
    wordQuery = wordQuery.or(`simplified.ilike.%${q}%,pinyin.ilike.%${q}%,meaning_mn.ilike.%${q}%`);
  }

  // Статусаар шүүхэд эхлээд entries-ээс id-уудыг авна (RLS admin → бүгд харагдана)
  let allowedIds: Set<number> | null = null;
  if (opts.status !== "all") {
    const { data: levelWords } = await client
      .from("hsk_words")
      .select("id")
      .eq("hsk_level", opts.level)
      .limit(6000);
    const ids = (levelWords ?? []).map((w) => Number(w.id));
    const withEntry = new Map<number, DictStatus>();
    for (let i = 0; i < ids.length; i += 800) {
      const { data } = await client
        .from("dictionary_entries")
        .select("word_id, status")
        .in("word_id", ids.slice(i, i + 800));
      for (const e of data ?? []) withEntry.set(Number(e.word_id), e.status as DictStatus);
    }
    allowedIds = new Set(
      ids.filter((id) =>
        opts.status === "none" ? !withEntry.has(id) : withEntry.get(id) === opts.status
      )
    );
    if (allowedIds.size === 0) return [];
    wordQuery = wordQuery.in("id", [...allowedIds].slice(0, 1000));
  }

  const { data: words, error } = await wordQuery.limit(limit);
  if (error || !words) return [];

  const wordIds = words.map((w) => Number(w.id));
  const statusMap = new Map<number, DictStatus>();
  const senseCount = new Map<number, number>();
  if (wordIds.length) {
    const [{ data: entries }, { data: senses }] = await Promise.all([
      client.from("dictionary_entries").select("word_id, status").in("word_id", wordIds),
      client.from("dictionary_senses").select("word_id").in("word_id", wordIds),
    ]);
    for (const e of entries ?? []) statusMap.set(Number(e.word_id), e.status as DictStatus);
    for (const s of senses ?? []) {
      const k = Number(s.word_id);
      senseCount.set(k, (senseCount.get(k) ?? 0) + 1);
    }
  }

  return words.map((w) => ({
    ...(w as unknown as DictWordHead),
    id: Number(w.id),
    status: statusMap.get(Number(w.id)) ?? null,
    sense_count: senseCount.get(Number(w.id)) ?? 0,
  }));
}

export async function getDictionaryWordFull(
  wordId: number,
  clientOverride?: SupabaseClient
): Promise<DictWordFull | null> {
  const client = clientOverride ?? (await createServerSupabaseClient());
  if (!client) return null;

  const { data: word } = await client
    .from("hsk_words")
    .select("id, simplified, traditional, pinyin, pos, hsk_level, frequency, meaning_en, meaning_mn, example_zh, example_mn")
    .eq("id", wordId)
    .maybeSingle();
  if (!word) return null;

  const [{ data: entryRow }, { data: senseRows }] = await Promise.all([
    client.from("dictionary_entries").select("*").eq("word_id", wordId).maybeSingle(),
    client
      .from("dictionary_senses")
      .select("id, sense_no, pos, gloss_zh, meaning_mn, synonyms_mn, meaning_en, note_mn")
      .eq("word_id", wordId)
      .order("sense_no"),
  ]);

  const senseIds = (senseRows ?? []).map((s) => Number(s.id));
  const examplesBySense = new Map<number, DictSense["examples"]>();
  if (senseIds.length) {
    const { data: exRows } = await client
      .from("dictionary_examples")
      .select("id, sense_id, example_no, zh, pinyin, mn")
      .in("sense_id", senseIds)
      .order("example_no");
    for (const ex of exRows ?? []) {
      const k = Number(ex.sense_id);
      const list = examplesBySense.get(k) ?? [];
      list.push({ id: Number(ex.id), zh: String(ex.zh), pinyin: (ex.pinyin as string | null) ?? null, mn: String(ex.mn) });
      examplesBySense.set(k, list);
    }
  }

  const entry: DictEntry | null = entryRow
    ? {
        word_id: Number(entryRow.word_id),
        status: entryRow.status as DictStatus,
        usage_note_mn: (entryRow.usage_note_mn as string | null) ?? null,
        measure_words: (entryRow.measure_words as string[] | null) ?? [],
        collocations: Array.isArray(entryRow.collocations) ? (entryRow.collocations as DictEntry["collocations"]) : [],
        confusable_with: (entryRow.confusable_with as string[] | null) ?? [],
        register: (entryRow.register as string | null) ?? null,
        source: String(entryRow.source ?? "ai"),
        reviewed_at: (entryRow.reviewed_at as string | null) ?? null,
      }
    : null;

  const senses: DictSense[] = (senseRows ?? []).map((s) => ({
    id: Number(s.id),
    sense_no: Number(s.sense_no),
    pos: (s.pos as string | null) ?? null,
    gloss_zh: (s.gloss_zh as string | null) ?? null,
    meaning_mn: String(s.meaning_mn ?? ""),
    synonyms_mn: (s.synonyms_mn as string[] | null) ?? [],
    meaning_en: (s.meaning_en as string | null) ?? null,
    note_mn: (s.note_mn as string | null) ?? null,
    examples: examplesBySense.get(Number(s.id)) ?? [],
  }));

  return { word: { ...(word as unknown as DictWordHead), id: Number(word.id) }, entry, senses };
}

/** Дараагийн хянах үг — ижил түвшин, ижил статус (эсвэл бичилтгүй), давтамжаар. */
export async function getNextDictionaryWordId(
  level: string,
  afterWordId: number,
  status: DictStatus | "none"
): Promise<number | null> {
  const rows = await getDictionaryQueue({ level, status, limit: 400 });
  const idx = rows.findIndex((r) => r.id === afterWordId);
  const next = rows.find((r, i) => i > idx && r.id !== afterWordId) ?? rows.find((r) => r.id !== afterWordId);
  return next?.id ?? null;
}
