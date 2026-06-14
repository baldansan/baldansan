import { normalizeSeriesCoverUrl } from "@/lib/bichleg/series-cover";

/** Learner card image from admin-uploaded thumbnail_url only. */
export function resolveSeriesThumbnailUrl(series: {
  thumbnail_url?: string | null;
}): string | null {
  return normalizeSeriesCoverUrl(series.thumbnail_url);
}
