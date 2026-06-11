import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateBichlegPages } from "@/lib/bichleg/revalidate";
import { getAdminBichlegSupabaseClient } from "@/lib/supabase/admin-bichleg-client";

type RouteContext = { params: Promise<{ videoId: string }> };

async function requireAdminBichlegClient() {
  const result = await getAdminBichlegSupabaseClient();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    );
  }
  return result.client;
}

export async function PATCH(request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminBichlegClient();
  if (clientOrResponse instanceof NextResponse) return clientOrResponse;

  const { videoId } = await context.params;
  const id = decodeURIComponent(videoId).trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "videoId байхгүй." },
      { status: 400 }
    );
  }

  let body: { sync_offset_sec?: number };
  try {
    body = (await request.json()) as { sync_offset_sec?: number };
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON бие буруу." },
      { status: 400 }
    );
  }

  const offset = Number(body.sync_offset_sec);
  if (!Number.isFinite(offset)) {
    return NextResponse.json(
      { ok: false, error: "sync_offset_sec тоо байх ёстой." },
      { status: 400 }
    );
  }

  const { error } = await clientOrResponse
    .from("videos")
    .update({ sync_offset_sec: offset })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 422 }
    );
  }

  revalidateBichlegPages();
  revalidatePath("/admin/bichleg");

  return NextResponse.json({ ok: true, sync_offset_sec: offset });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const clientOrResponse = await requireAdminBichlegClient();
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
