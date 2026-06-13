import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateBichlegPages } from "@/lib/bichleg/revalidate";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

type RouteContext = { params: Promise<{ videoId: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminServiceRoleClient();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

  const { videoId } = await context.params;
  const id = decodeURIComponent(videoId).trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "videoId байхгүй." },
      { status: 400 }
    );
  }

  let body: { subtitle_offset_sec?: number; sync_offset_sec?: number };
  try {
    body = (await request.json()) as {
      subtitle_offset_sec?: number;
      sync_offset_sec?: number;
    };
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON бие буруу." },
      { status: 400 }
    );
  }

  const offset = Number(body.subtitle_offset_sec ?? body.sync_offset_sec);
  if (!Number.isFinite(offset)) {
    return NextResponse.json(
      { ok: false, error: "subtitle_offset_sec тоо байх ёстой." },
      { status: 400 }
    );
  }

  const { error } = await clientOrResponse
    .from("videos")
    .update({ subtitle_offset_sec: offset })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 422 }
    );
  }

  revalidateBichlegPages();
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true, subtitle_offset_sec: offset });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminServiceRoleClient();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

  const { videoId } = await context.params;
  const id = decodeURIComponent(videoId).trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "videoId байхгүй." },
      { status: 400 }
    );
  }

  const { error } = await clientOrResponse.from("videos").delete().eq("id", id);

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
