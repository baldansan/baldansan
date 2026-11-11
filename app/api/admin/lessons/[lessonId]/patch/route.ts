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
 *    vocabulary?: [{ chinese, exampleChinese?, examplePinyin?, exampleMongolian?, mongolian?, notes? }] // vocabulary_words мөрийг chinese-ээр олж шинэчилнэ
 *    quiz?: [{ type, question, options, correct_answer, explanation, order_index?, option_feedback? }]  // хичээлийн БҮХ сорилыг сольно
 *    quizExplanations?: [{ id, explanation }]   // зөвхөн тайлбарыг шинэчилнэ
 *    lesson?: { title?, chinese_title?, subtitle?, description? }
 *    recount?: true }                            // lessons.vocabulary_count / quiz_count-ыг бодит тоогоор
 */
export async function PUT(request: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  if (!hasServerSupabaseConfig) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  if (!(await isCurrentUserAdminServer())) return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase client алга." }, { status: 503 });
  const { lessonId } = await ctx.params;

  let body: { study?: unknown; vocabulary?: unknown; quiz?: unknown; quizExplanations?: unknown; lesson?: unknown; recount?: unknown };
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

  // --- Сорилыг бүхэлд нь солих ---
  if (Array.isArray(body.quiz) && body.quiz.length) {
    const rows: Rec[] = [];
    body.quiz.forEach((item, i) => {
      if (!isRec(item) || typeof item.question !== "string" || typeof item.correct_answer !== "string") return;
      rows.push({
        lesson_id: lessonId,
        type: typeof item.type === "string" ? item.type : "multiple_choice",
        question: item.question,
        options: Array.isArray(item.options) ? item.options : [],
        correct_answer: item.correct_answer,
        explanation: typeof item.explanation === "string" ? item.explanation : null,
        order_index: typeof item.order_index === "number" ? item.order_index : i + 1,
        ...(isRec(item.option_feedback) ? { option_feedback: item.option_feedback } : {}),
      });
    });
    if (!rows.length) return NextResponse.json({ error: "quiz: хүчинтэй асуулт алга." }, { status: 400 });
    const del = await client.from("quiz_questions").delete().eq("lesson_id", lessonId);
    if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
    const ins = await client.from("quiz_questions").insert(rows).select("id");
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    result.quizInserted = ins.data?.length ?? 0;
    body.recount = true;
  }

  // --- Зөвхөн тайлбар ---
  if (Array.isArray(body.quizExplanations) && body.quizExplanations.length) {
    let updated = 0;
    const failed: string[] = [];
    for (const item of body.quizExplanations) {
      if (!isRec(item) || item.id == null || typeof item.explanation !== "string" || !item.explanation.trim()) continue;
      const { data, error } = await client
        .from("quiz_questions")
        .update({ explanation: item.explanation.trim() })
        .eq("id", item.id as string | number)
        .eq("lesson_id", lessonId)
        .select("id");
      if (error || !data?.length) failed.push(String(item.id));
      else updated += 1;
    }
    result.quizExplanationsUpdated = updated;
    result.quizExplanationsFailed = failed;
  }

  // --- Хичээлийн мета ---
  const lessonPatch: Rec = {};
  if (isRec(body.lesson)) {
    for (const k of ["title", "chinese_title", "subtitle", "description"] as const) {
      const v = body.lesson[k];
      if (typeof v === "string" && v.trim()) lessonPatch[k] = v.trim();
    }
  }
  if (body.recount === true) {
    const [v, q] = await Promise.all([
      client.from("vocabulary_words").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId),
      client.from("quiz_questions").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId),
    ]);
    if (!v.error) lessonPatch.vocabulary_count = v.count ?? 0;
    if (!q.error) lessonPatch.quiz_count = q.count ?? 0;
  }
  if (Object.keys(lessonPatch).length) {
    const { error } = await client.from("lessons").update(lessonPatch).eq("id", lessonId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result.lessonPatched = lessonPatch;
  }

  revalidateLesson(lessonId);
  revalidateCatalog(["lessons"]);
  return NextResponse.json(result);
}
