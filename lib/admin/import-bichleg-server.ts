import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { revalidateBichlegPages } from "@/lib/bichleg/revalidate";
import type {
  BichlegImportApiResult,
  BichlegImportFileResult,
  BichlegSeriesPayload,
  BichlegVideoPayload,
} from "@/lib/import/bichleg-video-types";
import {
  displayBichlegLabel,
  validateBichlegSeriesJson,
  validateBichlegVideoJson,
} from "@/lib/import/bichleg-video-validate";

export async function upsertBichlegSeriesOnServer(
  client: SupabaseClient,
  seriesList: BichlegSeriesPayload[]
): Promise<BichlegImportFileResult[]> {
  const results: BichlegImportFileResult[] = [];
  const seen = new Set<string>();

  for (const series of seriesList) {
    if (seen.has(series.id)) continue;
    seen.add(series.id);

    const validation = validateBichlegSeriesJson(
      {
        id: series.id,
        title_zh: series.titleZh,
        title_mn: series.titleMn,
        description_mn: series.descriptionMn,
        cover_url: series.coverUrl,
        hsk_level: series.hskLevel,
      },
      "series.json"
    );

    if (!validation.ok || !validation.seriesPayload) {
      results.push({
        fileName: "series.json",
        ok: false,
        seriesId: series.id,
        errors: validation.errors,
        message: `${series.id}: цуврал шалгалт амжилтгүй`,
      });
      continue;
    }

    const row = validation.seriesPayload;
    const { error } = await client.from("video_series").upsert(
      {
        id: row.id,
        title_zh: row.titleZh,
        title_mn: row.titleMn,
        description_mn: row.descriptionMn,
        cover_url: row.coverUrl,
        hsk_level: row.hskLevel,
      },
      { onConflict: "id" }
    );

    if (error) {
      results.push({
        fileName: "series.json",
        ok: false,
        seriesId: row.id,
        errors: [error.message],
        message: `${row.id}: цуврал оруулахад алдаа`,
      });
      continue;
    }

    results.push({
      fileName: "series.json",
      ok: true,
      seriesId: row.id,
      message: `${row.id}: цуврал бэлэн ✓`,
    });
  }

  return results;
}

async function importOneVideo(
  client: SupabaseClient,
  pkg: BichlegVideoPayload,
  fileName: string
): Promise<BichlegImportFileResult> {
  const label = displayBichlegLabel(fileName, pkg.videoId);

  const validation = validateBichlegVideoJson(
    {
      video_id: pkg.videoId,
      youtube_id: pkg.youtubeId,
      title_zh: pkg.titleZh,
      title_mn: pkg.titleMn,
      source: pkg.source,
      source_url: pkg.sourceUrl,
      hsk_level: pkg.hskLevel,
      duration_sec: pkg.durationSec,
      sync_offset_sec: pkg.syncOffsetSec,
      tags: pkg.tags,
      series_id: pkg.seriesId,
      episode_no: pkg.episodeNo,
      subtitles: pkg.subtitles.map((s) => ({
        index: s.idx,
        start: s.startSec,
        end: s.endSec,
        speaker: s.speaker,
        zh: s.zh,
        pinyin: s.pinyin,
        mn: s.mn,
        words: s.words,
      })),
    },
    fileName
  );

  if (!validation.ok || !validation.payload) {
    return {
      fileName,
      ok: false,
      videoId: pkg.videoId,
      errors: validation.errors,
      message: `${label}: шалгалт амжилтгүй`,
    };
  }

  const payload = validation.payload;

  if (payload.seriesId) {
    const { data: seriesRow } = await client
      .from("video_series")
      .select("id")
      .eq("id", payload.seriesId)
      .maybeSingle();

    if (!seriesRow) {
      return {
        fileName,
        ok: false,
        videoId: payload.videoId,
        seriesId: payload.seriesId,
        errors: [`Цуврал «${payload.seriesId}» олдсонгүй — эхлээд series.json оруулна уу.`],
        message: `${label}: цуврал олдсонгүй`,
      };
    }
  }

  const header = {
    id: payload.videoId,
    youtube_id: payload.youtubeId,
    title_zh: payload.titleZh,
    title_mn: payload.titleMn,
    source: payload.source,
    source_url: payload.sourceUrl,
    hsk_level: payload.hskLevel,
    duration_sec: payload.durationSec,
    sync_offset_sec: payload.syncOffsetSec,
    tags: payload.tags,
    series_id: payload.seriesId,
    episode_no: payload.episodeNo,
  };

  const { error: videoErr } = await client
    .from("videos")
    .upsert(header, { onConflict: "id" });

  if (videoErr) {
    return {
      fileName,
      ok: false,
      videoId: payload.videoId,
      errors: [videoErr.message],
      message: `${label}: видео оруулахад алдаа`,
    };
  }

  const rows = payload.subtitles.map((s) => ({
    video_id: payload.videoId,
    idx: s.idx,
    start_sec: s.startSec,
    end_sec: s.endSec,
    speaker: s.speaker,
    zh: s.zh,
    pinyin: s.pinyin,
    mn: s.mn,
    words: s.words,
  }));

  if (rows.length) {
    const { error: subErr } = await client
      .from("video_subtitles")
      .upsert(rows, { onConflict: "video_id,idx" });

    if (subErr) {
      return {
        fileName,
        ok: false,
        videoId: payload.videoId,
        errors: [subErr.message],
        message: `${label}: хадмал оруулахад алдаа`,
      };
    }
  }

  const ep =
    payload.episodeNo != null ? ` · ${payload.episodeNo}-р анги` : "";
  const series =
    payload.seriesId != null ? `${payload.seriesId}${ep}` : label;

  return {
    fileName,
    ok: true,
    videoId: payload.videoId,
    seriesId: payload.seriesId ?? undefined,
    subtitleCount: rows.length,
    message: `${series}: ${rows.length} мөр орлоо ✓`,
  };
}

export async function importBichlegVideosOnServer(
  client: SupabaseClient,
  packages: BichlegVideoPayload[],
  fileNames: string[] = [],
  seriesList: BichlegSeriesPayload[] = []
): Promise<BichlegImportApiResult> {
  const results: BichlegImportFileResult[] = [];

  if (seriesList.length) {
    const seriesResults = await upsertBichlegSeriesOnServer(client, seriesList);
    results.push(...seriesResults);
  }

  for (let i = 0; i < packages.length; i += 1) {
    const pkg = packages[i];
    const fileName = fileNames[i] ?? `${pkg.videoId}.json`;
    const result = await importOneVideo(client, pkg, fileName);
    results.push(result);
  }

  if (results.some((r) => r.ok)) {
    revalidateBichlegPages();
    revalidatePath("/admin/bichleg");
  }

  const videoResults = results.filter((r) => r.videoId || r.subtitleCount != null);
  const allOk =
    results.length > 0 &&
    (packages.length === 0
      ? results.every((r) => r.ok)
      : videoResults.every((r) => r.ok) &&
        results.filter((r) => r.seriesId && !r.videoId).every((r) => r.ok));

  return {
    ok: allOk,
    results,
    errors: results.filter((r) => !r.ok).flatMap((r) => r.errors ?? []),
  };
}
