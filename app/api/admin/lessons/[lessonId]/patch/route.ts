import { NextResponse } from "next/server";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { revalidateCatalog, revalidateLesson } from "@/lib/cache/catalog-revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Admin PUT: хичээлийн хэсэгчилсэн шинэчлэл (бусад агуулга хэвээр).
 * Body:
 *  { study?: { grammar?: ..., texts?: ..., workbook?: ... }   // hskStudyContent-ийн түлхүүр бүрийг солино
 *    vocabulary?: [{ chinese, exampleChinese?, examplePinyin?, exampleMongolian?, mongolian?, notes? }] } // vocabulary_words мөрийг chinese-ээр олж шинэчилнэ
 */
export async function PUT(request: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  if (!hasServerSupabaseConfig) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  if (!(await isCurrentUserAdminServer())) return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase client алга." }, { status: 503 });
  const { lessonId } = await ctx.params;

  let body: { study?: unknown; vocabulary?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Буруу JSON." }, { status: 400 });
  }
  const result: Rec = { ok: true, lessonId };

  if (isRec(body.study) && Object.keys(body.study).length) {
    const { data: row, error: readErr } = await client.from("lessons").select("id, source_note").eq("id", lessonId).maybeSingle();
    if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Хичээл олдсонгүй." }, { status: 404 });
    let note: Rec = {};
    const raw = typeof row.source_note === "string" ? row.source_note.trim() : "";
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!isRec(parsed)) throw new Error("not object");
        note = parsed;
      } catch {
        return NextResponse.json({ error: "source_note JSON биш — зөвхөн JSON source_note-той хичээлд ажиллана." }, { status: 409 });
      }
    }
    const study: Rec = isRec(note.hskStudyContent) ? { ...note.hskStudyContent } : {};
    for (const [k, v] of Object.entries(body.study)) {
      if (v === null) delete study[k];
      else study[k] = v;
    }
    note.hskStudyContent = study;
    const { error } = await client.from("lessons").update({ source_note: JSON.stringify(note) }).eq("id", lessonId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result.studyKeys = Object.keys(body.study);
  }

  if (Array.isArray(body.vocabulary) && body.vocabulary.length) {
    let updated = 0;
    const missing: string[] = [];
    for (const item of body.vocabulary) {
      if (!isRec(item) || typeof item.chinese !== "string") continue;
      const patch: Rec = {};
      if (typeof item.exampleChinese === "string") patch.example_chinese = item.exampleChinese.trim() || null;
      if (typeof item.exampleMongolian === "string") patch.example_mongolian = item.exampleMongolian.trim() || null;
      if (typeof item.examplePinyin === "string") patch.example_pinyin = item.examplePinyin.trim() || null;
      if (typeof item.mongolian === "string" && item.mongolian.trim()) patch.mongolian = item.mongolian.trim();
      if (typeof item.notes === "string") patch.notes = item.notes.trim() || null;
      if (!Object.keys(patch).length) continue;
      const { data, error } = await client
        .from("vocabulary_words")
        .update(patch)
        .eq("lesson_id", lessonId)
        .eq("chinese", item.chinese.trim())
        .select("id");
      if (error) {
        // example_pinyin / notes багана байхгүй байж болно — тэдгээргүйгээр дахин оролдоно
        delete patch.example_pinyin;
        delete patch.notes;
        if (!Object.keys(patch).length) continue;
        const retry = await client.from("vocabulary_words").update(patch).eq("lesson_id", lessonId).eq("chinese", item.chinese.trim()).select("id");
        if (retry.error) return NextResponse.json({ error: retry.error.message, updated }, { status: 500 });
        if (retry.data?.length) updated += retry.data.length;
        else missing.push(item.chinese);
        continue;
      }
      if (data?.length) updated += data.length;
      else missing.push(item.chinese);
    }
    result.vocabularyUpdated = updated;
    result.vocabularyMissing = missing;
  }

  revalidateLesson(lessonId);
  revalidateCatalog(["lessons"]);
  return NextResponse.json(result);
}
