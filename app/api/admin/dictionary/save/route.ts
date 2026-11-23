import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DictSavePayload, DictStatus } from "@/lib/dictionary/types";

const STATUSES: DictStatus[] = ["draft", "reviewed", "approved", "rejected"];

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x ?? "").trim()).filter(Boolean);
}
function cleanText(v: unknown): string | null {
  const t = String(v ?? "").trim();
  return t || null;
}

/**
 * POST /api/admin/dictionary/save — нэг үгийн толийн бичилтийг бүтнээр хадгална.
 * Body: DictSavePayload. Утгуудыг устгаад шинээр бичнэ (sense_no дарааллаар).
 */
export async function POST(request: Request) {
  const auth = await getAdminServiceRoleSupabaseClient();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const client = auth.client;

  let body: DictSavePayload;
  try {
    body = (await request.json()) as DictSavePayload;
  } catch {
    return NextResponse.json({ error: "JSON буруу." }, { status: 400 });
  }
  const wordId = Number(body.wordId);
  if (!Number.isFinite(wordId) || wordId <= 0) {
    return NextResponse.json({ error: "wordId буруу." }, { status: 400 });
  }
  const status: DictStatus = STATUSES.includes(body.status) ? body.status : "draft";
  const senses = Array.isArray(body.senses) ? body.senses : [];
  if (senses.length === 0 || !senses.some((s) => String(s.meaning_mn ?? "").trim())) {
    return NextResponse.json({ error: "Дор хаяж нэг утга (монгол) байх ёстой." }, { status: 400 });
  }

  // Хянагчийн id-г session-ээс (service role client-д хэрэглэгч байхгүй).
  let reviewerId: string | null = null;
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: userData } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null } };
    reviewerId = userData?.user?.id ?? null;
  } catch {
    reviewerId = null;
  }
  const reviewing = status === "reviewed" || status === "approved";

  const entry = body.entry ?? ({} as DictSavePayload["entry"]);
  const collocations = Array.isArray(entry.collocations)
    ? entry.collocations
        .map((c) => ({ zh: String(c?.zh ?? "").trim(), pinyin: cleanText(c?.pinyin), mn: String(c?.mn ?? "").trim() }))
        .filter((c) => c.zh && c.mn)
    : [];

  const { error: e1 } = await client.from("dictionary_entries").upsert(
    {
      word_id: wordId,
      status,
      usage_note_mn: cleanText(entry.usage_note_mn),
      measure_words: cleanList(entry.measure_words).length ? cleanList(entry.measure_words) : null,
      collocations: collocations.length ? collocations : null,
      confusable_with: cleanList(entry.confusable_with).length ? cleanList(entry.confusable_with) : null,
      register: cleanText(entry.register),
      source: "teacher",
      ...(reviewing ? { reviewed_by: reviewerId, reviewed_at: new Date().toISOString() } : {}),
    },
    { onConflict: "word_id" }
  );
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { error: eDel } = await client.from("dictionary_senses").delete().eq("word_id", wordId);
  if (eDel) return NextResponse.json({ error: eDel.message }, { status: 500 });

  const senseRows = senses
    .filter((s) => String(s.meaning_mn ?? "").trim())
    .map((s, i) => ({
      word_id: wordId,
      sense_no: i + 1,
      pos: cleanText(s.pos),
      gloss_zh: cleanText(s.gloss_zh),
      meaning_mn: String(s.meaning_mn).trim(),
      synonyms_mn: cleanList(s.synonyms_mn).length ? cleanList(s.synonyms_mn) : null,
      meaning_en: cleanText(s.meaning_en),
      note_mn: cleanText(s.note_mn),
      status,
    }));
  const { data: inserted, error: e2 } = await client
    .from("dictionary_senses")
    .insert(senseRows)
    .select("id, sense_no");
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const exampleRows: Record<string, unknown>[] = [];
  for (const s of inserted ?? []) {
    const src = senses.filter((x) => String(x.meaning_mn ?? "").trim())[Number(s.sense_no) - 1];
    (src?.examples ?? []).forEach((ex, j) => {
      const zh = String(ex?.zh ?? "").trim();
      const mn = String(ex?.mn ?? "").trim();
      if (zh && mn) exampleRows.push({ sense_id: s.id, example_no: j + 1, zh, pinyin: cleanText(ex.pinyin), mn, source: "teacher" });
    });
  }
  if (exampleRows.length) {
    const { error: e3 } = await client.from("dictionary_examples").insert(exampleRows);
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, wordId, status, senses: senseRows.length, examples: exampleRows.length });
}
