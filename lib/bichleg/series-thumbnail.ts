import { normalizeSeriesCoverUrl } from "@/lib/bichleg/series-cover";
import { youtubeThumbUrl } from "@/lib/bichleg/youtube-thumb";

/** Admin-uploaded thumbnail first, else the first episode's YouTube thumb. */
export function resolveSeriesThumbnailUrl(series: {
  thumbnail_url?: string | null;
  fallbackYoutubeId?: string | null;
}): string | null {
  return (
    normalizeSeriesCoverUrl(series.thumbnail_url) ??
    youtubeThumbUrl(series.fallbackYoutubeId)
  );
}
