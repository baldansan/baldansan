import { NextResponse } from "next/server";
import { createServerSupabaseClient, hasServerSupabaseConfig } from "@/lib/supabase/server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { revalidateCatalog, revalidateLesson } from "@/lib/cache/catalog-revalidate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Admin PUT: зөвхөн дасгалын номыг (workbook.json агуулга) солино — бусад
 * агуулга (texts/grammar/vocab/quiz) хэвээр. Body: { workbook: {...} }.
 * lessons.source_note (JSON) → hskStudyContent.workbook = body.workbook.
 * Хуучин flat түлхүүрүүд (workbookListening/Reading/Writing) байвал устгана.
 */
export async function PUT(request: Request, ctx: { params: Promise<{ lessonId: string }> }) {
  if (!hasServerSupabaseConfig) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  if (!(await isCurrentUserAdminServer())) return NextResponse.json({ error: "Admin эрх шаардлагатай." }, { status: 403 });
  const client = await createServerSupabaseClient();
  if (!client) return NextResponse.json({ error: "Supabase client алга." }, { status: 503 });
  const { lessonId } = await ctx.params;

  let body: { workbook?: unknown };
  try {
    body = (await request.json()) as { workbook?: unknown };
  } catch {
    return NextResponse.json({ error: "Буруу JSON." }, { status: 400 });
  }
  if (!isRec(body.workbook)) return NextResponse.json({ error: "workbook объект хэрэгтэй." }, { status: 400 });

  const { data: row, error: readErr } = await client.from("lessons").select("id, source_note").eq("id", lessonId).maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Хичээл олдсонгүй." }, { status: 404 });

  let note: Rec = {};
  const raw = typeof row.source_note === "string" ? row.source_note : "";
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isRec(parsed)) note = parsed;
      else return NextResponse.json({ error: "source_note JSON биш — зөвхөн JSON source_note-той хичээлд ажиллана." }, { status: 409 });
    } catch {
      return NextResponse.json({ error: "source_note JSON биш — зөвхөн JSON source_note-той хичээлд ажиллана." }, { status: 409 });
    }
  }
  const study: Rec = isRec(note.hskStudyContent) ? { ...note.hskStudyContent } : {};
  for (const k of ["workbookListening", "workbookReading", "workbookWriting"]) delete study[k];
  study.workbook = body.workbook;
  note.hskStudyContent = study;

  const { error } = await client.from("lessons").update({ source_note: JSON.stringify(note) }).eq("id", lessonId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateLesson(lessonId);
  revalidateCatalog(["lessons"]);
  return NextResponse.json({ ok: true, lessonId, bytes: JSON.stringify(note).length });
}
