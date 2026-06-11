import { NextResponse } from "next/server";
import { importBichlegVideosOnServer } from "@/lib/admin/import-bichleg-server";
import type { BichlegImportApiBody } from "@/lib/import/bichleg-video-types";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

async function requireAdminImport() {
  if (!hasServerSupabaseConfig) {
    return NextResponse.json(
      { ok: false, errors: ["Supabase тохируулагдаагүй."] },
      { status: 503 }
    );
  }

  if (!hasServiceRoleSupabaseConfig) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          "SUPABASE_SERVICE_ROLE_KEY тохируулагдаагүй — бичлэг оруулах боломжгүй.",
        ],
      },
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

  const serviceClient = createServiceRoleSupabaseClient();
  if (!serviceClient) {
    return NextResponse.json(
      { ok: false, errors: ["Service role клиент үүсгэж чадсангүй."] },
      { status: 503 }
    );
  }

  return serviceClient;
}

export async function POST(request: Request) {
  const clientOrResponse = await requireAdminImport();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

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
      clientOrResponse,
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
