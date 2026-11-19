import { NextResponse } from "next/server";
import { revalidateCatalog } from "@/lib/cache/catalog-revalidate";
import { getAdminServiceRoleSupabaseClient } from "@/lib/supabase/admin-service-role-client";

export const maxDuration = 120;

/**
 * Бичлэгийн бодит HSK түвшинг хадмалын үгсээс тооцно.
 * Түвшин L = хадмалын үгсийн (давталттай) дор хаяж `threshold` хувь нь HSK ≤ L байх хамгийн бага L.
 * HSK жагсаалтад байхгүй үгийг ханзаар нь задалж үзнэ; тэгээд ч олдохгүй бол «түвшнээс дээш» гэж тоолно.
 * body: { seriesIds: string[], scale?: "old" | "new", threshold?: number, apply?: boolean }
 */
type Body = {
  seriesIds?: string[];
  scale?: "old" | "new";
  threshold?: number;
  apply?: boolean;
  /** Гараар тогтоох: { "<videoId>": түвшин } — тооцоолол хийхгүй, шууд хадгална. */
  set?: Record<string, number>;
};

const CJK = /[一-鿿]/;

export async function POST(request: Request) {
  const admin = await getAdminServiceRoleSupabaseClient();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }
  const client = admin.client;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON бие буруу байна." }, { status: 400 });
  }
  if (body.set && Object.keys(body.set).length) {
    const done: string[] = [];
    for (const [id, lv] of Object.entries(body.set).slice(0, 200)) {
      const level = Math.min(9, Math.max(1, Math.round(Number(lv))));
      const { error } = await client.from("videos").update({ hsk_level: level }).eq("id", id);
      if (!error) done.push(`${id}:${level}`);
    }
    revalidateCatalog(["videos"]);
    return NextResponse.json({ ok: true, set: done });
  }

  const seriesIds = (body.seriesIds ?? []).slice(0, 20);
  const scale = body.scale === "new" ? "new" : "old";
  const threshold = Math.min(0.99, Math.max(0.5, body.threshold ?? 0.9));
  if (!seriesIds.length) {
    return NextResponse.json({ ok: false, error: "seriesIds хоосон." }, { status: 400 });
  }

  const { data: videos, error: vErr } = await client
    .from("videos")
    .select("id, series_id, episode_no, title_mn, hsk_level")
    .in("series_id", seriesIds)
    .order("episode_no", { ascending: true });
  if (vErr || !videos) {
    return NextResponse.json({ ok: false, error: vErr?.message ?? "Бичлэг олдсонгүй." }, { status: 500 });
  }

  // Бичлэг бүрийн үгийн давтамж
  const perVideo = new Map<string, Map<string, number>>();
  const allWords = new Set<string>();
  for (const v of videos) {
    const counts = new Map<string, number>();
    const { data: subs } = await client
      .from("video_subtitles")
      .select("words")
      .eq("video_id", v.id)
      .limit(2000);
    for (const row of (subs ?? []) as { words: { zh?: string }[] | null }[]) {
      for (const w of row.words ?? []) {
        const zh = (w.zh ?? "").trim();
        if (!zh || !CJK.test(zh)) continue;
        counts.set(zh, (counts.get(zh) ?? 0) + 1);
        allWords.add(zh);
        for (const ch of zh) if (CJK.test(ch)) allWords.add(ch);
      }
    }
    perVideo.set(String(v.id), counts);
  }

  // HSK түвшин
  const level = new Map<string, number>();
  const list = [...allWords];
  for (let i = 0; i < list.length; i += 300) {
    const { data } = await client
      .from("hsk_words")
      .select("simplified, hsk_level, hsk_old")
      .in("simplified", list.slice(i, i + 300));
    for (const row of (data ?? []) as {
      simplified: string;
      hsk_level: string | null;
      hsk_old: number[] | null;
    }[]) {
      let lv: number;
      if (scale === "old") {
        lv = row.hsk_old?.length ? Math.min(...row.hsk_old) : 7;
      } else {
        lv = parseInt(String(row.hsk_level ?? "7").split("-")[0], 10) || 7;
      }
      const prev = level.get(row.simplified);
      if (prev == null || lv < prev) level.set(row.simplified, lv);
    }
  }

  const wordLevel = (w: string): number => {
    const direct = level.get(w);
    if (direct != null) return direct;
    let max = 0;
    for (const ch of w) {
      if (!CJK.test(ch)) continue;
      const lv = level.get(ch);
      if (lv == null) return 7;
      if (lv > max) max = lv;
    }
    return max || 7;
  };

  const results = videos.map((v) => {
    const counts = perVideo.get(String(v.id)) ?? new Map<string, number>();
    const byLevel = [0, 0, 0, 0, 0, 0, 0, 0]; // 1..7
    let total = 0;
    for (const [w, n] of counts) {
      byLevel[Math.min(7, wordLevel(w))] += n;
      total += n;
    }
    const coverage: number[] = [];
    let acc = 0;
    let suggested = 6;
    let found = false;
    for (let lv = 1; lv <= 6; lv += 1) {
      acc += byLevel[lv];
      const c = total ? acc / total : 0;
      coverage.push(Math.round(c * 100));
      if (!found && c >= threshold) {
        suggested = lv;
        found = true;
      }
    }
    return {
      id: String(v.id),
      seriesId: String(v.series_id),
      ep: v.episode_no,
      title: v.title_mn,
      current: v.hsk_level,
      tokens: total,
      coverage,
      suggested,
    };
  });

  if (body.apply) {
    for (const r of results) {
      if (r.tokens > 0 && r.suggested !== r.current) {
        await client.from("videos").update({ hsk_level: r.suggested }).eq("id", r.id);
      }
    }
    for (const sid of seriesIds) {
      const levels = results.filter((r) => r.seriesId === sid && r.tokens > 0).map((r) => r.suggested);
      if (levels.length) {
        await client.from("video_series").update({ hsk_level: Math.min(...levels) }).eq("id", sid);
      }
    }
    revalidateCatalog(["videos"]);
  }

  return NextResponse.json({ ok: true, scale, threshold, applied: Boolean(body.apply), results });
}
