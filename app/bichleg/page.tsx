import { BichlegSeriesPickerClient } from "@/components/bichleg/bichleg-series-picker-client";
import {
  fetchSeriesWatchProgressMap,
  isServerUserAuthenticated,
} from "@/lib/supabase/video-progress-server";
import {
  countOrphanVideos,
  fetchVideoSeriesCatalog,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Бичлэг — Бөөндөө Сурцгаая",
};

export default async function BichlegPage() {
  const [seriesList, orphanCount] = await Promise.all([
    fetchVideoSeriesCatalog(),
    countOrphanVideos(),
  ]);

  const showProgress = await isServerUserAuthenticated();
  const totalsBySeriesId = Object.fromEntries(
    seriesList.map((s) => [s.id, s.videoCount])
  );
  const seriesProgress = showProgress
    ? await fetchSeriesWatchProgressMap(
        seriesList.map((s) => s.id),
        totalsBySeriesId
      )
    : {};

  return (
    <BichlegSeriesPickerClient
      seriesList={seriesList}
      orphanCount={orphanCount}
      seriesProgress={seriesProgress}
      showProgress={showProgress}
    />
  );
}
