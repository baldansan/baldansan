import { BichlegEpisodeListClient } from "@/components/bichleg/bichleg-episode-list-client";
import { fetchUserVideoProgressMap } from "@/lib/supabase/video-progress-server";
import {
  fetchOrphanEpisodes,
  fetchSeriesEpisodes,
  fetchVideoSeriesById,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ seriesId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { seriesId } = await params;
  if (seriesId === "other") {
    return { title: "Бусад бичлэг — Бөөндөө Сурцгаая" };
  }
  const series = await fetchVideoSeriesById(seriesId);
  return {
    title: series?.title_mn ?? series?.title_zh ?? `Бичлэг — ${seriesId}`,
  };
}

export default async function BichlegSeriesEpisodeListPage({ params }: Props) {
  const { seriesId } = await params;

  if (seriesId === "other") {
    const episodes = await fetchOrphanEpisodes();
    const progressByVideoId = await fetchUserVideoProgressMap(
      episodes.map((ep) => ep.id)
    );
    return (
      <BichlegEpisodeListClient
        seriesId="other"
        series={null}
        episodes={episodes}
        progressByVideoId={progressByVideoId}
      />
    );
  }

  const [series, episodes] = await Promise.all([
    fetchVideoSeriesById(seriesId),
    fetchSeriesEpisodes(seriesId),
  ]);

  if (!episodes.length) {
    console.warn("[bichleg] series episode list empty", { seriesId, hasSeries: Boolean(series) });
  }

  const progressByVideoId = await fetchUserVideoProgressMap(
    episodes.map((ep) => ep.id)
  );

  return (
    <BichlegEpisodeListClient
      seriesId={seriesId}
      series={series}
      episodes={episodes}
      progressByVideoId={progressByVideoId}
    />
  );
}
