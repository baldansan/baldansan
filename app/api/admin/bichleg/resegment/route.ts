import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import { resegmentVideo } from "@/lib/bichleg/youtube/resegment";

export const maxDuration = 300;

/** Бүх бичлэгийн id — «үгээр нь нийлүүлэх» ажлыг нэг нэгээр гүйлгэхэд. */
export async function GET() {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }
  const { data, error } = await admin.client
    .from("videos")
    .select("id, title_mn, series_id, episode_no")
    .order("series_id", { ascending: true })
    .order("episode_no", { ascending: true })
    .limit(2000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, videos: data ?? [] });
}

/** Нэг бичлэгийн хадмалыг толь бичгийн бүтэн үгээр дахин задална. */
export async function POST(request: Request) {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  let body: { videoId?: string };
  try {
    body = (await request.json()) as { videoId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON бие буруу байна." }, { status: 400 });
  }
  const videoId = String(body.videoId ?? "").trim();
  if (!videoId) return NextResponse.json({ ok: false, error: "videoId алга." }, { status: 400 });

  try {
    const result = await resegmentVideo(admin.client, videoId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/admin/bichleg/resegment]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Үгээр задлахад алдаа гарлаа." },
      { status: 500 }
    );
  }
}
