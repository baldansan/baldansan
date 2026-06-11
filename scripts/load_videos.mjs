/**
 * Load short videos from data/videos/*.json into Supabase.
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Apply: supabase/migrations/030_videos_bichleg.sql
 *        supabase/migrations/031_video_series.sql
 *
 * Run: npm run load:videos
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve("data/videos");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

function isSeriesFile(fileName, raw) {
  if (/^series\.json$/i.test(fileName)) return true;
  return Boolean(raw?.id && !raw?.video_id && !Array.isArray(raw?.subtitles));
}

async function loadSeries(supabase, raw) {
  const id = String(raw.id ?? "").trim();
  if (!id) throw new Error("series: id required");

  const row = {
    id,
    title_zh: raw.title_zh ?? null,
    title_mn: raw.title_mn ?? null,
    description_mn: raw.description_mn ?? null,
    cover_url: raw.cover_url ?? null,
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
  };

  const { error } = await supabase
    .from("video_series")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error(`${id} series: ${error.message}`);
  return id;
}

async function loadFile(supabase, filePath) {
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  const raw = JSON.parse(readFileSync(filePath, "utf8"));

  if (isSeriesFile(fileName, raw)) {
    const seriesId = await loadSeries(supabase, raw);
    return { kind: "series", seriesId, subtitleCount: 0 };
  }

  const videoId = String(raw.video_id ?? "").trim();
  if (!videoId) throw new Error(`${filePath}: video_id required`);

  const seriesId = raw.series_id ? String(raw.series_id).trim() : null;
  const episodeNo =
    raw.episode_no != null && Number.isFinite(Number(raw.episode_no))
      ? Number(raw.episode_no)
      : null;

  if (seriesId) {
    const { data: seriesRow } = await supabase
      .from("video_series")
      .select("id")
      .eq("id", seriesId)
      .maybeSingle();
    if (!seriesRow) {
      throw new Error(`${filePath}: series «${seriesId}» олдсонгүй`);
    }
  }

  const header = {
    id: videoId,
    youtube_id: String(raw.youtube_id ?? "").trim(),
    title_zh: raw.title_zh ?? null,
    title_mn: raw.title_mn ?? null,
    source: raw.source ?? null,
    source_url: raw.source_url ?? null,
    hsk_level: raw.hsk_level != null ? Number(raw.hsk_level) : null,
    duration_sec: raw.duration_sec != null ? Number(raw.duration_sec) : null,
    sync_offset_sec: Number(raw.sync_offset_sec ?? 0),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    series_id: seriesId,
    episode_no: episodeNo,
  };

  if (!header.youtube_id) {
    throw new Error(`${filePath}: youtube_id required`);
  }

  const { error: videoErr } = await supabase
    .from("videos")
    .upsert(header, { onConflict: "id" });
  if (videoErr) throw new Error(`${videoId} videos: ${videoErr.message}`);

  const subtitles = Array.isArray(raw.subtitles) ? raw.subtitles : [];
  const rows = subtitles.map((s) => ({
    video_id: videoId,
    idx: Number(s.index ?? s.idx),
    start_sec: Number(s.start ?? s.start_sec),
    end_sec: Number(s.end ?? s.end_sec),
    speaker:
      typeof s.speaker === "string" && s.speaker.trim()
        ? s.speaker.trim()
        : null,
    zh: s.zh ?? null,
    pinyin: s.pinyin ?? null,
    mn: s.mn ?? null,
    words: s.words ?? null,
  }));

  if (rows.length) {
    const { error: subErr } = await supabase
      .from("video_subtitles")
      .upsert(rows, { onConflict: "video_id,idx" });
    if (subErr) throw new Error(`${videoId} subtitles: ${subErr.message}`);
  }

  return { kind: "video", videoId, subtitleCount: rows.length };
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!existsSync(ROOT)) {
    console.log("videos: 0, subtitles: 0, series: 0");
    return;
  }

  const files = readdirSync(ROOT).filter((f) => f.endsWith(".json"));
  let videoCount = 0;
  let subtitleCount = 0;
  let seriesCount = 0;

  const sorted = [...files].sort((a, b) => {
    const aSeries = /^series\.json$/i.test(a);
    const bSeries = /^series\.json$/i.test(b);
    if (aSeries && !bSeries) return -1;
    if (!aSeries && bSeries) return 1;
    return a.localeCompare(b);
  });

  for (const file of sorted) {
    const result = await loadFile(supabase, join(ROOT, file));
    if (result.kind === "series") {
      seriesCount += 1;
    } else {
      videoCount += 1;
      subtitleCount += result.subtitleCount;
    }
  }

  console.log(
    `videos: ${videoCount}, subtitles: ${subtitleCount}, series: ${seriesCount}`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
