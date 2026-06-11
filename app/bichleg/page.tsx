import { BichlegSeriesPickerClient } from "@/components/bichleg/bichleg-series-picker-client";
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

  return (
    <BichlegSeriesPickerClient
      seriesList={seriesList}
      orphanCount={orphanCount}
    />
  );
}
