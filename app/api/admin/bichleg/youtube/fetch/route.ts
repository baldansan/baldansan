import { NextResponse } from "next/server";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";
import {
  extractYoutubeId,
  fetchYoutubeTitle,
  parsePastedSubtitles,
} from "@/lib/bichleg/youtube/captions";
import { hasTranslateKey } from "@/lib/bichleg/youtube/claude";

export const maxDuration = 60;

/** YouTube холбоос + наасан хадмал → цагтай хятад мөрүүд. */
export async function POST(request: Request) {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  let body: { url?: string; pasted?: string };
  try {
    body = (await request.json()) as { url?: string; pasted?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON бие буруу байна." }, { status: 400 });
  }

  const youtubeId = extractYoutubeId(body.url ?? "");
  if (!youtubeId) {
    return NextResponse.json(
      { ok: false, error: "YouTube холбоос танигдсангүй." },
      { status: 400 }
    );
  }

  const { data: existing } = await admin.client
    .from("videos")
    .select("id, title_mn")
    .eq("youtube_id", youtubeId)
    .limit(1);
  const already = existing?.[0]
    ? { id: String(existing[0].id), titleMn: existing[0].title_mn as string | null }
    : null;

  const titleZh = await fetchYoutubeTitle(youtubeId);

  if (!body.pasted?.trim()) {
    return NextResponse.json(
      { ok: false, youtubeId, titleZh, already, error: "Хадмалаа наана уу." },
      { status: 422 }
    );
  }

  const lines = parsePastedSubtitles(body.pasted);
  if (!lines.length) {
    return NextResponse.json(
      {
        ok: false,
        youtubeId,
        titleZh,
        already,
        error:
          "Наасан хадмалаас цагтай хятад мөр олдсонгүй. «0:05» гэх мэт цагтай транскрипт эсвэл SRT наана уу.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    youtubeId,
    titleZh,
    lines,
    already,
    hasTranslateKey,
  });
}
