import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import {
  fetchVideoSeriesById,
  fetchVideosBySeriesId,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ seriesId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { seriesId } = await params;
  const series = await fetchVideoSeriesById(seriesId);
  return {
    title: series?.title_mn ?? series?.title_zh ?? `Бичлэг — ${seriesId}`,
  };
}

export default async function BichlegSeriesFeedPage({ params }: Props) {
  const { seriesId } = await params;
  const [videos, series] = await Promise.all([
    fetchVideosBySeriesId(seriesId),
    fetchVideoSeriesById(seriesId),
  ]);

  return (
    <BichlegFeedClient
      videos={videos}
      backHref="/bichleg"
      feedTitle={series?.title_mn ?? series?.title_zh ?? seriesId}
    />
  );
}
