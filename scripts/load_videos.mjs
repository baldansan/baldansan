/**
 * Load short videos from data/videos/*.json into Supabase.
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Apply: supabase/migrations/030_videos_bichleg.sql
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

async function loadFile(supabase, filePath) {
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  const videoId = String(raw.video_id ?? "").trim();
  if (!videoId) throw new Error(`${filePath}: video_id required`);

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

  return { videoId, subtitleCount: rows.length };
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!existsSync(ROOT)) {
    console.log("videos: 0, subtitles: 0");
    return;
  }

  const files = readdirSync(ROOT).filter((f) => f.endsWith(".json"));
  let videoCount = 0;
  let subtitleCount = 0;

  for (const file of files.sort()) {
    const result = await loadFile(supabase, join(ROOT, file));
    videoCount += 1;
    subtitleCount += result.subtitleCount;
  }

  console.log(`videos: ${videoCount}, subtitles: ${subtitleCount}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
