import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import { fetchVideoSeriesList, fetchVideos } from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Бичлэг — Бөөндөө Сурцгаая",
};

export default async function BichlegPage() {
  const [videos, seriesList] = await Promise.all([
    fetchVideos(),
    fetchVideoSeriesList(),
  ]);
  return <BichlegFeedClient videos={videos} seriesList={seriesList} />;
}
