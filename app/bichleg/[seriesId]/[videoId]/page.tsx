import { notFound } from "next/navigation";
import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import { fetchUserVideoProgressMap } from "@/lib/supabase/video-progress-server";
import {
  fetchOrphanEpisodes,
  fetchSeriesEpisodes,
  fetchVideoSeriesById,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ seriesId: string; videoId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { seriesId, videoId } = await params;
  const episodes =
    seriesId === "other"
      ? await fetchOrphanEpisodes()
      : await fetchSeriesEpisodes(seriesId);
  const video = episodes.find((ep) => ep.id === decodeURIComponent(videoId));
  if (video?.title_mn) return { title: video.title_mn };
  if (seriesId === "other") return { title: "Бусад бичлэг" };
  const series = await fetchVideoSeriesById(seriesId);
  return {
    title: series?.title_mn ?? series?.title_zh ?? `Бичлэг — ${seriesId}`,
  };
}

export default async function BichlegEpisodePlayerPage({ params }: Props) {
  const { seriesId, videoId: rawVideoId } = await params;
  const videoId = decodeURIComponent(rawVideoId);
  const listHref = `/bichleg/${encodeURIComponent(seriesId)}`;

  const episodes =
    seriesId === "other"
      ? await fetchOrphanEpisodes()
      : await fetchSeriesEpisodes(seriesId);

  const activeIndex = episodes.findIndex((ep) => ep.id === videoId);
  if (activeIndex < 0) notFound();

  const [progressByVideoId, series] = await Promise.all([
    fetchUserVideoProgressMap(episodes.map((ep) => ep.id)),
    seriesId === "other" ? Promise.resolve(null) : fetchVideoSeriesById(seriesId),
  ]);

  const feedTitle =
    seriesId === "other"
      ? "Бусад бичлэг"
      : (series?.title_mn ?? series?.title_zh ?? seriesId);

  return (
    <BichlegFeedClient
      videos={episodes}
      backHref={listHref}
      feedTitle={feedTitle}
      progressByVideoId={progressByVideoId}
      initialActiveIndex={activeIndex}
    />
  );
}
