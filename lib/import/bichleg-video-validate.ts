import type {
  BichlegFileValidation,
  BichlegSeriesPayload,
  BichlegSubtitlePayload,
  BichlegVideoPayload,
  RawBichlegSeries,
  RawBichlegSubtitle,
  RawBichlegVideo,
} from "@/lib/import/bichleg-video-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Цэг, таслал, зайг хасаж хятад мөрийг харьцуулна. */
export function normalizeZhForCompare(value: string): string {
  return value.replace(/[，。！？、,\.!?;；：:\s"'「」『』（）()【】\[\]—\-…]/g, "");
}

function subtitleIndex(row: RawBichlegSubtitle, fallback: number): number {
  const idx = row.index ?? row.idx;
  return Number.isFinite(Number(idx)) ? Number(idx) : fallback;
}

function subtitleStart(row: RawBichlegSubtitle): number {
  const value = row.start ?? row.start_sec;
  return Number(value);
}

function subtitleEnd(row: RawBichlegSubtitle): number {
  const value = row.end ?? row.end_sec;
  return Number(value);
}

export function isSeriesJsonFile(fileName: string, raw: unknown): boolean {
  if (/^series\.json$/i.test(fileName)) return true;
  if (!isRecord(raw)) return false;
  const hasId = nonEmpty(raw.id);
  const hasVideoId = nonEmpty(raw.video_id);
  const hasSubtitles = Array.isArray(raw.subtitles) && raw.subtitles.length > 0;
  return hasId && !hasVideoId && !hasSubtitles;
}

export function validateBichlegSeriesJson(
  raw: unknown,
  fileName: string
): BichlegFileValidation {
  const errors: string[] = [];

  if (!isRecord(raw)) {
    return {
      fileName,
      kind: "series",
      ok: false,
      errors: ["JSON бүтэц буруу — объект байх ёстой."],
    };
  }

  const data = raw as RawBichlegSeries;
  const id = nonEmpty(data.id) ? data.id.trim() : "";
  const titleMn = nonEmpty(data.title_mn) ? data.title_mn.trim() : "";

  if (!id) errors.push("id байхгүй.");
  if (!titleMn) errors.push("title_mn байхгүй.");

  if (errors.length > 0) {
    return { fileName, kind: "series", ok: false, errors };
  }

  const payload: BichlegSeriesPayload = {
    id,
    titleZh: nonEmpty(data.title_zh) ? data.title_zh.trim() : null,
    titleMn,
    descriptionMn: nonEmpty(data.description_mn) ? data.description_mn.trim() : null,
    coverUrl: nonEmpty(data.cover_url) ? data.cover_url.trim() : null,
    hskLevel: data.hsk_level != null ? Number(data.hsk_level) : null,
  };

  return {
    fileName,
    kind: "series",
    ok: true,
    errors: [],
    preview: {
      seriesId: id,
      seriesTitleMn: titleMn,
      titleMn,
    },
    seriesPayload: payload,
  };
}

export function validateBichlegVideoJson(
  raw: unknown,
  fileName: string
): BichlegFileValidation {
  if (isSeriesJsonFile(fileName, raw)) {
    return validateBichlegSeriesJson(raw, fileName);
  }

  const errors: string[] = [];

  if (!isRecord(raw)) {
    return {
      fileName,
      kind: "video",
      ok: false,
      errors: ["JSON бүтэц буруу — объект байх ёстой."],
    };
  }

  const data = raw as RawBichlegVideo;
  const videoId = nonEmpty(data.video_id) ? data.video_id.trim() : "";
  const youtubeId = nonEmpty(data.youtube_id) ? data.youtube_id.trim() : "";
  const titleMn = nonEmpty(data.title_mn) ? data.title_mn.trim() : "";
  const seriesId = nonEmpty(data.series_id) ? data.series_id.trim() : null;
  const episodeRaw = data.episode_no;
  const episodeNo =
    episodeRaw != null && Number.isFinite(Number(episodeRaw))
      ? Number(episodeRaw)
      : null;

  if (!videoId) errors.push("video_id байхгүй.");
  if (!youtubeId) errors.push("youtube_id байхгүй.");
  if (!titleMn) errors.push("title_mn байхгүй.");

  if (seriesId && episodeNo == null) {
    errors.push("series_id байвал episode_no заавал.");
  }
  if (episodeNo != null && !seriesId) {
    errors.push("episode_no байвал series_id заавал.");
  }
  if (episodeNo != null && (!Number.isInteger(episodeNo) || episodeNo < 1)) {
    errors.push("episode_no эерэг бүхэл тоо байх ёстой.");
  }

  if (!Array.isArray(data.subtitles) || data.subtitles.length === 0) {
    errors.push("subtitles[] хоосон эсвэл байхгүй.");
    return { fileName, kind: "video", ok: false, errors };
  }

  const subtitles: BichlegSubtitlePayload[] = [];
  const sorted = [...data.subtitles].map((row, i) => ({
    row,
    idx: subtitleIndex(row, i + 1),
    order: i,
  }));
  sorted.sort((a, b) => a.idx - b.idx || a.order - b.order);

  let prevEnd: number | null = null;

  for (const { row, idx } of sorted) {
    const path = `subtitles[${idx}]`;
    const start = subtitleStart(row);
    const end = subtitleEnd(row);

    if (!Number.isFinite(start)) {
      errors.push(`${path}: start тоо биш.`);
    }
    if (!Number.isFinite(end)) {
      errors.push(`${path}: end тоо биш.`);
    }
    if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
      errors.push(`${path}: start (${start}) end (${end})-ээс бага байх ёстой.`);
    }
    if (prevEnd != null && Number.isFinite(start) && start < prevEnd) {
      errors.push(
        `${path}: хугацаа давхцаж байна — start (${start}) өмнөх end (${prevEnd})-ээс бага.`
      );
    }
    if (Number.isFinite(end)) {
      prevEnd = end;
    }

    if (!nonEmpty(row.zh)) errors.push(`${path}: zh байхгүй.`);
    if (!nonEmpty(row.pinyin)) errors.push(`${path}: pinyin байхгүй.`);
    if (!nonEmpty(row.mn)) errors.push(`${path}: mn байхгүй.`);

    if (!Array.isArray(row.words) || row.words.length === 0) {
      errors.push(`${path}: words[] хоосон эсвэл байхгүй.`);
      continue;
    }

    const words = row.words.map((word, wordIndex) => {
      const wordPath = `${path}.words[${wordIndex + 1}]`;
      const zh = nonEmpty(word.zh) ? word.zh.trim() : "";
      const pinyin = nonEmpty(word.pinyin) ? word.pinyin.trim() : "";
      const mn = nonEmpty(word.mn) ? word.mn.trim() : "";

      if (!zh) errors.push(`${wordPath}: zh байхгүй.`);
      if (!pinyin) errors.push(`${wordPath}: pinyin байхгүй.`);
      if (!mn) errors.push(`${wordPath}: mn байхгүй.`);

      return { zh, pinyin, mn, key: Boolean(word.key) };
    });

    if (nonEmpty(row.zh)) {
      const concat = words.map((w) => w.zh).join("");
      const rowNorm = normalizeZhForCompare(row.zh.trim());
      const concatNorm = normalizeZhForCompare(concat);
      if (rowNorm !== concatNorm) {
        errors.push(
          `${path}: words[].zh нийлбэр («${concat}») мөрийн zh («${row.zh.trim()}»)-тай таарахгүй.`
        );
      }
    }

    if (
      nonEmpty(row.zh) &&
      nonEmpty(row.pinyin) &&
      nonEmpty(row.mn) &&
      Number.isFinite(start) &&
      Number.isFinite(end)
    ) {
      subtitles.push({
        idx,
        startSec: start,
        endSec: end,
        speaker: nonEmpty(row.speaker) ? row.speaker.trim() : null,
        zh: row.zh.trim(),
        pinyin: row.pinyin.trim(),
        mn: row.mn.trim(),
        words,
      });
    }
  }

  if (errors.length > 0) {
    return { fileName, kind: "video", ok: false, errors };
  }

  const payload: BichlegVideoPayload = {
    videoId,
    youtubeId,
    titleZh: nonEmpty(data.title_zh) ? data.title_zh.trim() : null,
    titleMn,
    source: nonEmpty(data.source) ? data.source.trim() : null,
    sourceUrl: nonEmpty(data.source_url) ? data.source_url.trim() : null,
    hskLevel: data.hsk_level != null ? Number(data.hsk_level) : null,
    durationSec: data.duration_sec != null ? Number(data.duration_sec) : null,
    syncOffsetSec: Number(data.sync_offset_sec ?? 0),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    seriesId,
    episodeNo,
    subtitles,
  };

  return {
    fileName,
    kind: "video",
    ok: true,
    errors: [],
    preview: {
      videoId,
      titleMn,
      subtitleCount: subtitles.length,
      youtubeId,
      seriesId: seriesId ?? undefined,
      episodeNo,
    },
    payload,
  };
}

export function parseBichlegJsonFileText(
  text: string,
  fileName: string
): BichlegFileValidation {
  try {
    const raw = JSON.parse(text) as unknown;
    return validateBichlegVideoJson(raw, fileName);
  } catch {
    return {
      fileName,
      kind: "video",
      ok: false,
      errors: ["JSON уншихад алдаа гарлаа — формат буруу байна."],
    };
  }
}

export function displayBichlegLabel(
  fileName: string,
  videoId?: string
): string {
  const stem = fileName.replace(/\.json$/i, "");
  if (stem && stem !== "series") return stem;
  if (videoId) return videoId.replace(/^bv-/, "");
  return "бичлэг";
}

export function formatFilePreviewLine(entry: BichlegFileValidation): string {
  if (entry.kind === "series" && entry.preview?.seriesId) {
    return `${entry.preview.seriesId} · цуврал · ${entry.preview.seriesTitleMn ?? ""}`;
  }
  const series = entry.preview?.seriesId ?? "—";
  const ep =
    entry.preview?.episodeNo != null
      ? `${entry.preview.episodeNo}-р анги`
      : "—";
  const lines = entry.preview?.subtitleCount ?? 0;
  const status = entry.ok ? "✓" : "✗";
  return `${series} · ${ep} · ${lines} мөр · ${status}`;
}
