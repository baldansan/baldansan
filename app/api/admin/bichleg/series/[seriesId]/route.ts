import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateBichlegPages } from "@/lib/bichleg/revalidate";
import { fetchAdminSeriesEpisodes } from "@/lib/admin/bichleg-admin-server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

type RouteContext = { params: Promise<{ seriesId: string }> };

async function requireAdminServiceRoleClient() {
  const result = await getAdminServiceRoleSupabaseClient();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }
  return result.client;
}

export async function GET(_request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminServiceRoleClient();
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
  const clientOrResponse = await requireAdminServiceRoleClient();
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

  revalidateBichlegPages();
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true });
}
