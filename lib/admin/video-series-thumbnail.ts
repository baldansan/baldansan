import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSeriesCoverUrl } from "@/lib/bichleg/series-cover";

export const VIDEO_THUMBNAILS_BUCKET = "video-thumbnails";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function sanitizeSeriesId(seriesId: string): string {
  return seriesId.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extFromMime(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export function getVideoSeriesThumbnailPath(seriesId: string, ext: string): string {
  return `${sanitizeSeriesId(seriesId)}/thumbnail.${ext}`;
}

export function parseVideoThumbnailStoragePath(
  publicUrl: string | null | undefined
): string | null {
  const trimmed = publicUrl?.trim();
  if (!trimmed) return null;
  const marker = `/storage/v1/object/public/${VIDEO_THUMBNAILS_BUCKET}/`;
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(trimmed.slice(idx + marker.length));
}

export async function uploadVideoSeriesThumbnail(
  client: SupabaseClient,
  seriesId: string,
  file: File
): Promise<{ ok: true; thumbnail_url: string } | { ok: false; error: string }> {
  const mime = file.type.trim().toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Зөвхөн JPEG, PNG, WebP зураг оруулна уу." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Зураг 5MB-аас хэтрэхгүй байх ёстой." };
  }

  const ext = extFromMime(mime);
  if (!ext) {
    return { ok: false, error: "Зургийн төрөл тодорхойгүй." };
  }

  const storagePath = getVideoSeriesThumbnailPath(seriesId, ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await client.storage
    .from(VIDEO_THUMBNAILS_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: "3600",
      upsert: true,
      contentType: mime,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = client.storage
    .from(VIDEO_THUMBNAILS_BUCKET)
    .getPublicUrl(storagePath);

  const thumbnailUrl = normalizeSeriesCoverUrl(data.publicUrl);
  if (!thumbnailUrl) {
    return { ok: false, error: "Public URL үүсгэж чадсангүй." };
  }

  const { error: updateError } = await client
    .from("video_series")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", seriesId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true, thumbnail_url: thumbnailUrl };
}

export async function removeVideoSeriesThumbnail(
  client: SupabaseClient,
  seriesId: string,
  currentUrl: string | null | undefined
): Promise<{ ok: true } | { ok: false; error: string }> {
  const storagePath = parseVideoThumbnailStoragePath(currentUrl);
  if (storagePath) {
    const { error: removeError } = await client.storage
      .from(VIDEO_THUMBNAILS_BUCKET)
      .remove([storagePath]);
    if (removeError) {
      return { ok: false, error: removeError.message };
    }
  }

  const { error: updateError } = await client
    .from("video_series")
    .update({ thumbnail_url: null })
    .eq("id", seriesId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
