import { NextResponse } from "next/server";
import { importBichlegVideosOnServer } from "@/lib/admin/import-bichleg-server";
import type { BichlegImportApiBody } from "@/lib/import/bichleg-video-types";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

export const maxDuration = 60;

export async function POST(request: Request) {
  const clientResult = await getAdminServiceRoleSupabaseClient();
  if (!clientResult.ok) {
    return NextResponse.json(
      { ok: false, errors: [clientResult.error] },
      { status: clientResult.status }
    );
  }

  let body: BichlegImportApiBody;
  try {
    body = (await request.json()) as BichlegImportApiBody;
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["JSON бие буруу байна."] },
      { status: 400 }
    );
  }

  const packages = body.packages ?? [];
  const series = body.series ?? [];

  if (packages.length === 0 && series.length === 0) {
    return NextResponse.json(
      { ok: false, errors: ["Оруулах файл байхгүй."] },
      { status: 400 }
    );
  }

  try {
    const result = await importBichlegVideosOnServer(
      clientResult.client,
      packages,
      body.fileNames ?? [],
      series
    );
    const status = result.ok ? 200 : 422;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[api/admin/import/bichleg] Import failed", error);
    const message =
      error instanceof Error ? error.message : "Бичлэг оруулахад алдаа гарлаа.";
    return NextResponse.json(
      { ok: false, errors: [message], results: [] },
      { status: 500 }
    );
  }
}
