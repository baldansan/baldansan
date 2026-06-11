import { NextResponse } from "next/server";
import type { ImportDraftApiBody } from "@/lib/admin/build-import-draft-request";
import { importDraftLessonOnServer } from "@/lib/admin/import-lesson-server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import {
  createServerSupabaseClient,
  hasServerSupabaseConfig,
} from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, errors: ["Supabase is not configured."] },
      { status: 503 }
    );
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, errors: ["Could not create server client."] },
      { status: 503 }
    );
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, errors: ["Admin эрх шаардлагатай."] },
      { status: 403 }
    );
  }

  let body: ImportDraftApiBody;
  try {
    body = (await request.json()) as ImportDraftApiBody;
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["Invalid JSON body."] },
      { status: 400 }
    );
  }

  if (!body.courseId?.trim()) {
    return NextResponse.json(
      { ok: false, errors: ["courseId missing in manifest.json."] },
      { status: 400 }
    );
  }
  if (!body.lessonId?.trim()) {
    return NextResponse.json(
      { ok: false, errors: ["lessonId missing in manifest.json."] },
      { status: 400 }
    );
  }
  if (!body.importPayload) {
    return NextResponse.json(
      { ok: false, errors: ["ZIP parse data missing. Please validate again."] },
      { status: 400 }
    );
  }

  try {
    const result = await importDraftLessonOnServer(client, body);
    const status = result.ok ? 200 : 422;
    if (!result.ok) {
      console.error("[api/admin/import/lesson] Import rejected", {
        lessonId: body.lessonId,
        courseId: body.courseId,
        errors: result.errors,
        validationDetails: result.validationDetails,
      });
    }
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[api/admin/import/lesson] Import failed", error);
    const message =
      error instanceof Error ? error.message : "Import хийхэд алдаа гарлаа.";
    return NextResponse.json(
      { ok: false, errors: [message] },
      { status: 500 }
    );
  }
}
