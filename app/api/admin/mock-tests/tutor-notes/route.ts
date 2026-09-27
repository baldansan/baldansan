import { NextResponse } from "next/server";
import { parseTutorNote, type TutorNote } from "@/lib/mock-test/tutor-note";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ImportItem = { id: string; tutor_note: TutorNote };

/**
 * POST /api/admin/mock-tests/tutor-notes
 * Бие: `[{ id: "<question uuid>", tutor_note: {...} }, …]` эсвэл `{ items: [...] }`.
 * Асуулт бүрийн `tutor_note`-ыг id-аар нь шинэчилнэ (мөр нэмэхгүй).
 * Буцаах: { ok, updated, missing: [id…], errors: [text…] }.
 */
export async function POST(request: Request) {
  const clientResult = await getAdminServiceRoleSupabaseClient();
  if (!clientResult.ok) {
    return NextResponse.json(
      { ok: false, updated: 0, errors: [clientResult.error] },
      { status: clientResult.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, updated: 0, errors: ["JSON бие буруу байна."] },
      { status: 400 }
    );
  }

  const rawItems = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { items?: unknown }).items)
      ? ((body as { items: unknown[] }).items)
      : null;

  if (!rawItems || rawItems.length === 0) {
    return NextResponse.json(
      { ok: false, updated: 0, errors: ["Оруулах мөр байхгүй. JSON массив хүлээж байна."] },
      { status: 400 }
    );
  }

  const items: ImportItem[] = [];
  const errors: string[] = [];
  rawItems.forEach((raw, index) => {
    const row = raw as { id?: unknown; tutor_note?: unknown };
    const id = typeof row?.id === "string" ? row.id.trim() : "";
    if (!UUID_RE.test(id)) {
      errors.push(`#${index + 1}: id буруу (uuid биш).`);
      return;
    }
    const note = parseTutorNote(row.tutor_note);
    if (!note) {
      errors.push(`#${index + 1} (${id}): tutor_note буруу — «why» заавал, талбарын төрөл шалга.`);
      return;
    }
    items.push({ id, tutor_note: note });
  });

  if (items.length === 0) {
    return NextResponse.json({ ok: false, updated: 0, errors }, { status: 422 });
  }

  const client = clientResult.client;
  const ids = items.map((item) => item.id);
  const { data: existing, error: existErr } = await client
    .from("mock_test_questions")
    .select("id")
    .in("id", ids);
  if (existErr) {
    return NextResponse.json(
      { ok: false, updated: 0, errors: [existErr.message] },
      { status: 500 }
    );
  }
  const existingIds = new Set((existing ?? []).map((row) => String(row.id)));
  const missing = ids.filter((id) => !existingIds.has(id));

  let updated = 0;
  for (const item of items) {
    if (!existingIds.has(item.id)) continue;
    const { error } = await client
      .from("mock_test_questions")
      .update({ tutor_note: item.tutor_note })
      .eq("id", item.id);
    if (error) {
      errors.push(`${item.id}: ${error.message}`);
      continue;
    }
    updated += 1;
  }

  return NextResponse.json({
    ok: errors.length === 0 && missing.length === 0,
    updated,
    missing,
    errors,
    mode: clientResult.mode,
  });
}
