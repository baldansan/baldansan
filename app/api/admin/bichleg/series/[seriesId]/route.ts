import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchAdminSeriesEpisodes } from "@/lib/admin/bichleg-admin-server";
import { isCurrentUserAdminServer } from "@/lib/supabase/admin-server";
import { hasServerSupabaseConfig } from "@/lib/supabase/server";
import {
  createServiceRoleSupabaseClient,
  hasServiceRoleSupabaseConfig,
} from "@/lib/supabase/service-role-server";

type RouteContext = { params: Promise<{ seriesId: string }> };

async function requireAdminService() {
  if (!hasServerSupabaseConfig || !hasServiceRoleSupabaseConfig) {
    return NextResponse.json(
      { ok: false, error: "Supabase тохируулагдаагүй." },
      { status: 503 }
    );
  }

  const isAdmin = await isCurrentUserAdminServer();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Admin эрх шаардлагатай." },
      { status: 403 }
    );
  }

  const client = createServiceRoleSupabaseClient();
  if (!client) {
    return NextResponse.json(
      { ok: false, error: "Service role клиент үүсгэж чадсангүй." },
      { status: 503 }
    );
  }

  return client;
}

export async function GET(_request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminService();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

  const { seriesId } = await context.params;
  const id = decodeURIComponent(seriesId).trim();
  const data = await fetchAdminSeriesEpisodes(id);
  if (!data.series) {
    return NextResponse.json(
      { ok: false, error: "Цуврал олдсонгүй." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ...data });
}

export async function DELETE(request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminService();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

  const { seriesId } = await context.params;
  const id = decodeURIComponent(seriesId).trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "seriesId байхгүй." },
      { status: 400 }
    );
  }

  let body: { confirmTitle?: string };
  try {
    body = (await request.json()) as { confirmTitle?: string };
  } catch {
    body = {};
  }

  const { data: seriesRow } = await clientOrResponse
    .from("video_series")
    .select("title_mn")
    .eq("id", id)
    .maybeSingle();

  if (!seriesRow) {
    return NextResponse.json(
      { ok: false, error: "Цуврал олдсонгүй." },
      { status: 404 }
    );
  }

  const expected = String(seriesRow.title_mn ?? "").trim();
  const confirm = String(body.confirmTitle ?? "").trim();
  if (!expected || confirm !== expected) {
    return NextResponse.json(
      {
        ok: false,
        error: `Баталгаажуулахын тулд цувралын нэрийг яг бичнэ үү: «${expected}»`,
      },
      { status: 400 }
    );
  }

  const { error } = await clientOrResponse
    .from("video_series")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 422 }
    );
  }

  revalidatePath("/bichleg");
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true });
}
