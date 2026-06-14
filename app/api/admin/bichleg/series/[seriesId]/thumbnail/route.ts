import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateBichlegPages } from "@/lib/bichleg/revalidate";
import {
  removeVideoSeriesThumbnail,
  uploadVideoSeriesThumbnail,
} from "@/lib/admin/video-series-thumbnail";
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

export async function POST(request: Request, context: RouteContext) {
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

  const { data: seriesRow } = await clientOrResponse
    .from("video_series")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!seriesRow) {
    return NextResponse.json(
      { ok: false, error: "Цуврал олдсонгүй." },
      { status: 404 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "FormData уншихад алдаа." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "Зураг сонгоно уу." },
      { status: 400 }
    );
  }

  const result = await uploadVideoSeriesThumbnail(clientOrResponse, id, file);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 422 }
    );
  }

  revalidateBichlegPages();
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true, thumbnail_url: result.thumbnail_url });
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const { data: seriesRow } = await clientOrResponse
    .from("video_series")
    .select("thumbnail_url")
    .eq("id", id)
    .maybeSingle();

  if (!seriesRow) {
    return NextResponse.json(
      { ok: false, error: "Цуврал олдсонгүй." },
      { status: 404 }
    );
  }

  const result = await removeVideoSeriesThumbnail(
    clientOrResponse,
    id,
    seriesRow.thumbnail_url ? String(seriesRow.thumbnail_url) : null
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 422 }
    );
  }

  revalidateBichlegPages();
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true });
}
