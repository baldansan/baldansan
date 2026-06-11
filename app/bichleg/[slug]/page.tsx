import { BichlegFeedClient } from "@/components/bichleg/bichleg-feed-client";
import { resolveBichlegStartIndex } from "@/lib/bichleg/video-progress-utils";
import { fetchUserVideoProgressMap } from "@/lib/supabase/video-progress-server";
import {
  fetchOrphanVideos,
  fetchVideoSeriesById,
  fetchVideosBySeriesId,
} from "@/lib/supabase/videos-server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (slug === "other") {
    return { title: "Бусад бичлэг — Бөөндөө Сурцгаая" };
  }
  const series = await fetchVideoSeriesById(slug);
  return {
    title: series?.title_mn ?? series?.title_zh ?? `Бичлэг — ${slug}`,
  };
}

export default async function BichlegSeriesFeedPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { v: startVideoId } = await searchParams;

  if (slug === "other") {
    const videos = await fetchOrphanVideos();
    const progressByVideoId = await fetchUserVideoProgressMap(
      videos.map((video) => video.id)
    );
    const initialActiveIndex = resolveBichlegStartIndex(
      videos,
      progressByVideoId,
      startVideoId
    );
    return (
      <BichlegFeedClient
        videos={videos}
        backHref="/bichleg"
        feedTitle="Бусад бичлэг"
        progressByVideoId={progressByVideoId}
        initialActiveIndex={initialActiveIndex}
      />
    );
  }

  const [videos, series] = await Promise.all([
    fetchVideosBySeriesId(slug),
    fetchVideoSeriesById(slug),
  ]);
  const progressByVideoId = await fetchUserVideoProgressMap(
    videos.map((video) => video.id)
  );
  const initialActiveIndex = resolveBichlegStartIndex(
    videos,
    progressByVideoId,
    startVideoId
  );

  return (
    <BichlegFeedClient
      videos={videos}
      backHref="/bichleg"
      feedTitle={series?.title_mn ?? series?.title_zh ?? slug}
      progressByVideoId={progressByVideoId}
      initialActiveIndex={initialActiveIndex}
    />
  );
}
